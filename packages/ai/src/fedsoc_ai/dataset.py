import os
import json
import glob
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from sklearn.preprocessing import StandardScaler
from loguru import logger

# Resolve workspace root folder relative to this file
# packages/ai/src/fedsoc_ai/dataset.py is 4 directories down from the workspace root
ROOT = Path(__file__).resolve().parents[4]
DEFAULT_DATASET_DIR = ROOT / "Dataset"
DEFAULT_CLIENTS_DIR = ROOT / "datasets" / "clients"


class CICIDS2017Loader:
    """
    Handles discovery, loading, and schema validation of the CICIDS2017 Parquet files.
    """
    def __init__(self, directory: Path | str):
        self.directory = Path(directory)
        self.files = self._discover_files()
        
    def _discover_files(self) -> List[Path]:
        if not self.directory.exists():
            logger.warning(f"Dataset directory does not exist: {self.directory}")
            return []

        # Find .parquet files (case-insensitive glob search)
        files = list(self.directory.glob("*.parquet")) + list(self.directory.glob("*.Parquet"))
        # De-duplicate in case glob double matches
        files = sorted(list(set(files)))
        
        logger.info(f"Discovered {len(files)} Parquet files in '{self.directory}'")
        for f in files:
            logger.info(f" - Found file: {f.name} ({f.stat().st_size / (1024*1024):.2f} MB)")
        return files

    def load_file(self, filepath: Path) -> pd.DataFrame:
        """Loads a single Parquet file and standardizes column names."""
        logger.info(f"Loading file: {filepath.name}")
        df = pd.read_parquet(filepath, engine='pyarrow')
        # Clean column names (strip whitespaces)
        df.columns = df.columns.str.strip()
        return df

    def validate_schemas(self) -> Tuple[bool, List[str]]:
        """
        Validates that all discovered files share the same schema.
        Returns a boolean indicating consistency and a list of mismatch details if any.
        """
        if not self.files:
            return False, ["No files discovered to validate schemas."]

        mismatches = []
        # Use first file as reference schema
        ref_df = self.load_file(self.files[0])
        ref_cols = set(ref_df.columns)
        ref_name = self.files[0].name

        for filepath in self.files[1:]:
            filename = filepath.name
            df = pd.read_parquet(filepath, engine='pyarrow')
            df.columns = df.columns.str.strip()
            cols = set(df.columns)

            missing_in_file = ref_cols - cols
            extra_in_file = cols - ref_cols

            if missing_in_file or extra_in_file:
                msg = f"Schema mismatch in '{filename}' compared to '{ref_name}':"
                if missing_in_file:
                    msg += f" Missing columns: {missing_in_file}."
                if extra_in_file:
                    msg += f" Extra columns: {extra_in_file}."
                mismatches.append(msg)
                logger.warning(msg)
            else:
                logger.info(f"Schema check PASSED for '{filename}'")

        return len(mismatches) == 0, mismatches

    def load_all(self) -> pd.DataFrame:
        """Loads all discovered Parquet files and concatenates them into a single DataFrame."""
        if not self.files:
            logger.error("No files to load.")
            return pd.DataFrame()

        dfs = []
        for filepath in self.files:
            df = self.load_file(filepath)
            dfs.append(df)
        
        combined_df = pd.concat(dfs, ignore_index=True)
        logger.info(f"Combined dataset loaded successfully. Shape: {combined_df.shape}")
        return combined_df


class CICIDS2017Preprocessor:
    """
    Cleans, imputes, encodes, and normalizes CICIDS2017 data independently for each client.
    """
    def __init__(self, mapping_path: Optional[Path] = None):
        self.scaler = StandardScaler()
        self.label_mapping: Dict[str, int] = {}
        self.inverse_label_mapping: Dict[int, str] = {}
        self.numeric_features: List[str] = []
        self.is_fitted = False
        
        # Standardize mapping JSON path location inside datasets/clients
        if mapping_path is None:
            self.mapping_path = DEFAULT_CLIENTS_DIR / "label_mapping.json"
        else:
            self.mapping_path = Path(mapping_path)

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handles duplicates, infinity, and missing values."""
        df_copy = df.copy()
        
        # Sanitize Label strings if present (removes non-ascii characters like bad dashes)
        if 'Label' in df_copy.columns:
            df_copy['Label'] = df_copy['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip()
        
        # 1. Remove duplicates
        initial_rows = len(df_copy)
        df_copy.drop_duplicates(inplace=True)
        dropped_dups = initial_rows - len(df_copy)
        if dropped_dups > 0:
            logger.info(f"Removed {dropped_dups} duplicate rows.")

        # 2. Handle infinite values (convert to NaN)
        df_copy.replace([np.inf, -np.inf], np.nan, inplace=True)

        # 3. Handle missing values
        # Impute missing values with column medians for numeric fields
        numeric_cols = df_copy.select_dtypes(include=[np.number]).columns.tolist()
        if 'Label' in numeric_cols:
            numeric_cols.remove('Label')

        for col in numeric_cols:
            if df_copy[col].isnull().any():
                median_val = df_copy[col].median()
                if np.isnan(median_val):
                    median_val = 0.0
                df_copy[col] = df_copy[col].fillna(median_val)

        return df_copy

    def fit(self, df: pd.DataFrame) -> 'CICIDS2017Preprocessor':
        """Fits normalizer and establishes/loads label encodings."""
        df_clean = self.clean(df)
        
        if 'Label' not in df_clean.columns:
            raise ValueError("Dataset missing required target column: 'Label'")

        # 1. Setup Label Mapping (Shared Vocabulary across Clients)
        # We write/load a mapping JSON file to ensure labels correspond to the exact same integers
        if self.mapping_path.exists():
            logger.info(f"Loading pre-shared label mapping from: {self.mapping_path}")
            with open(self.mapping_path, 'r', encoding='utf-8') as f:
                self.label_mapping = json.load(f)
        else:
            logger.info(f"Label mapping not found at {self.mapping_path}. Fitting labels dynamically...")
            unique_labels = df_clean['Label'].unique()
            # Sort labels, making sure Benign/BENIGN is mapped to 0
            sorted_labels = sorted(unique_labels, key=lambda l: (str(l).upper() != 'BENIGN', str(l)))
            self.label_mapping = {str(label): idx for idx, label in enumerate(sorted_labels)}
            
            # Save mapping so it's shared across nodes
            self.mapping_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.mapping_path, 'w', encoding='utf-8') as f:
                json.dump(self.label_mapping, f, indent=2)
            logger.info(f"Saved Label Mapping: {self.label_mapping} to {self.mapping_path}")

        self.inverse_label_mapping = {idx: label for label, idx in self.label_mapping.items()}

        # 2. Detect numeric features for scaling (exclude identifiers and target metadata)
        ignore_cols = {'Label', 'Flow ID', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port', 'Timestamp', 'target', '_original_label'}
        self.numeric_features = [col for col in df_clean.columns if col not in ignore_cols and pd.api.types.is_numeric_dtype(df_clean[col])]
        
        # Fit StandardScaler locally on this client's unique data baseline
        if self.numeric_features:
            self.scaler.fit(df_clean[self.numeric_features].to_numpy())
            logger.info(f"Fitted standard scaler locally on {len(self.numeric_features)} numeric features.")
        
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforms raw client data into a clean, normalized training dataset."""
        if not self.is_fitted:
            self.fit(df)

        df_clean = self.clean(df)
        df_clean['_original_label'] = df_clean['Label'].astype(str)

        # 1. Encode labels using the persisted mapping
        df_clean['target'] = df_clean['_original_label'].map(self.label_mapping)
        # Default to 1 (anomaly) if a label was not in mapping
        df_clean['target'] = df_clean['target'].fillna(1).astype(int)

        # 2. Scale numeric features using this client's local scaler
        if self.numeric_features:
            scaled_vals = self.scaler.transform(df_clean[self.numeric_features].to_numpy())
            df_clean[self.numeric_features] = scaled_vals

        df_clean.drop(columns=['Label'], errors='ignore', inplace=True)
        return df_clean

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fits the pipeline locally and transforms raw data in one step."""
        return self.fit(df).transform(df)


class ClientPartitioner:
    """
    Slices raw, un-preprocessed datasets into 4 client silos based on attack label distributions.
    """
    @staticmethod
    def partition_iid(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """Deterministic IID split (25% each, preserving overall class distributions)."""
        shuffled = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
        n = len(shuffled)
        chunk = int(np.ceil(n / 4))
        
        return {
            "bank": shuffled.iloc[0:chunk].reset_index(drop=True),
            "hospital": shuffled.iloc[chunk:chunk*2].reset_index(drop=True),
            "retail": shuffled.iloc[chunk*2:chunk*3].reset_index(drop=True),
            "telecom": shuffled.iloc[chunk*3:].reset_index(drop=True)
        }

    @staticmethod
    def partition_non_iid(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """
        Slices dataset non-IID: normal (Benign) traffic is shared, 
        but attack classes are dynamically distributed among clients to simulate data silos.
        """
        # Exclude metadata or labels in comparison
        # Standardize labels casing checks
        df_copy = df.copy()
        if 'Label' in df_copy.columns:
            df_copy['Label'] = df_copy['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip()

        benign_df = df_copy[df_copy['Label'].str.upper() == 'BENIGN']
        attack_df = df_copy[df_copy['Label'].str.upper() != 'BENIGN']

        # 1. Split Benign traffic equally among all 4 clients to establish baseline
        benign_shuffled = benign_df.sample(frac=1.0, random_state=42).reset_index(drop=True)
        n_benign = len(benign_shuffled)
        chunk = int(np.ceil(n_benign / 4))
        benign_splits = [
            benign_shuffled.iloc[0:chunk].reset_index(drop=True),
            benign_shuffled.iloc[chunk:chunk*2].reset_index(drop=True),
            benign_shuffled.iloc[chunk*2:chunk*3].reset_index(drop=True),
            benign_shuffled.iloc[chunk*3:].reset_index(drop=True)
        ]

        # Initialize partitions lists
        partitions_data = {
            "bank": [benign_splits[0]],
            "hospital": [benign_splits[1]],
            "retail": [benign_splits[2]],
            "telecom": [benign_splits[3]]
        }

        # 2. Get sorted list of unique attack labels to partition deterministically
        unique_attacks = sorted(list(attack_df['Label'].unique()))
        clients = ["bank", "hospital", "retail", "telecom"]

        # Route all rows of each attack category to client based on index % 4
        # This routes attack types to client silos dynamically without hardcoding mappings!
        for i, attack_label in enumerate(unique_attacks):
            group = attack_df[attack_df['Label'] == attack_label]
            assigned_client = clients[i % 4]
            partitions_data[assigned_client].append(group)
            logger.info(f"Routing attack '{attack_label}' ({len(group)} rows) -> Client: {assigned_client}")

        # Concatenate and shuffle
        final_partitions = {}
        for client, df_list in partitions_data.items():
            final_partitions[client] = pd.concat(df_list, ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)
            logger.info(f"Partitioned Client '{client}': Total Rows={len(final_partitions[client])}")

        return final_partitions


# Clean public APIs

def load_dataset(path_or_dir: str | Path = DEFAULT_DATASET_DIR) -> pd.DataFrame:
    """Discovers and loads all parquet files in a directory or a single file."""
    path = Path(path_or_dir)
    if path.is_dir():
        loader = CICIDS2017Loader(path)
        success, mismatches = loader.validate_schemas()
        if not success:
            logger.warning(f"Schema mismatches detected: {mismatches}")
        return loader.load_all()
    elif path.is_file():
        df = pd.read_parquet(path, engine='pyarrow')
        df.columns = df.columns.str.strip()
        return df
    else:
        raise FileNotFoundError(f"Path not found: '{path_or_dir}'")


def preprocess(df: pd.DataFrame, mapping_path: Optional[Path] = None) -> pd.DataFrame:
    """Runs local preprocessor (imputation, local scaling, multi-class encoding) on client data."""
    preprocessor = CICIDS2017Preprocessor(mapping_path=mapping_path)
    return preprocessor.fit_transform(df)


def split_into_clients(df: pd.DataFrame, strategy: str = "non_iid") -> Dict[str, pd.DataFrame]:
    """Splits raw dataset into four regional client slices."""
    if strategy == "non_iid":
        return ClientPartitioner.partition_non_iid(df)
    elif strategy == "iid":
        return ClientPartitioner.partition_iid(df)
    else:
        raise ValueError(f"Unknown split strategy: '{strategy}'")


def get_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes statistics for a DataFrame.
    Acts as the single source of truth for metrics reporting.
    """
    stats = {}
    stats["num_rows"] = int(len(df))
    stats["num_columns"] = int(df.shape[1])
    
    # Missing values
    missing = df.isnull().sum()
    stats["missing_values"] = int(missing.sum())
    stats["missing_by_column"] = {str(k): int(v) for k, v in missing[missing > 0].items()}
    
    # Duplicate count
    stats["duplicate_count"] = int(df.duplicated().sum())

    # Label distributions
    label_col = '_original_label' if '_original_label' in df.columns else ('Label' if 'Label' in df.columns else None)
    if label_col:
        dist = df[label_col].value_counts().to_dict()
        stats["label_distribution"] = {str(k): int(v) for k, v in dist.items()}
    else:
        stats["label_distribution"] = {}

    if 'target' in df.columns:
        target_dist = df['target'].value_counts().to_dict()
        stats["target_distribution"] = {int(k): int(v) for k, v in target_dist.items()}

    # Memory usage in MB
    stats["memory_usage"] = float(df.memory_usage(deep=True).sum() / (1024 * 1024))

    # Feature summaries (mean, std, min, max) for top 10 numeric features to keep dict concise
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    ignore_cols = {'target', 'Label'}
    feature_cols = [c for c in numeric_cols if c not in ignore_cols][:10]
    
    feature_summary = {}
    for col in feature_cols:
        col_mean = df[col].mean()
        col_std = df[col].std()
        col_min = df[col].min()
        col_max = df[col].max()
        feature_summary[str(col)] = {
            "mean": float(col_mean) if not pd.isna(col_mean) else 0.0,
            "std": float(col_std) if not pd.isna(col_std) else 0.0,
            "min": float(col_min) if not pd.isna(col_min) else 0.0,
            "max": float(col_max) if not pd.isna(col_max) else 0.0,
        }
    stats["feature_summary"] = feature_summary

    return stats
