import os
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd
import numpy as np
from loguru import logger

from fedsoc.preprocessing import preprocess

# Constants
ROOT = Path("E:/CyberFed AI")
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

        files = list(self.directory.glob("*.parquet")) + list(self.directory.glob("*.Parquet"))
        files = sorted(list(set(files)))
        
        logger.info(f"Discovered {len(files)} Parquet files in '{self.directory}'")
        for f in files:
            logger.info(f" - Found file: {f.name} ({f.stat().st_size / (1024*1024):.2f} MB)")
        return files

    def load_file(self, filepath: Path) -> pd.DataFrame:
        """Loads a single Parquet file and standardizes column names."""
        logger.info(f"Loading file: {filepath.name}")
        df = pd.read_parquet(filepath, engine='pyarrow')
        df.columns = df.columns.str.strip()
        return df

    def validate_schemas(self) -> Tuple[bool, List[str]]:
        if not self.files:
            return False, ["No files discovered to validate schemas."]

        mismatches = []
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

class ClientPartitioner:
    """
    Slices raw datasets into 4 client silos.
    """
    @staticmethod
    def partition_iid(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
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
        df_copy = df.copy()
        if 'Label' in df_copy.columns:
            df_copy['Label'] = df_copy['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip()

        benign_df = df_copy[df_copy['Label'].str.upper() == 'BENIGN']
        attack_df = df_copy[df_copy['Label'].str.upper() != 'BENIGN']

        benign_shuffled = benign_df.sample(frac=1.0, random_state=42).reset_index(drop=True)
        n_benign = len(benign_shuffled)
        chunk = int(np.ceil(n_benign / 4))
        benign_splits = [
            benign_shuffled.iloc[0:chunk].reset_index(drop=True),
            benign_shuffled.iloc[chunk:chunk*2].reset_index(drop=True),
            benign_shuffled.iloc[chunk*2:chunk*3].reset_index(drop=True),
            benign_shuffled.iloc[chunk*3:].reset_index(drop=True)
        ]

        partitions_data = {
            "bank": [benign_splits[0]],
            "hospital": [benign_splits[1]],
            "retail": [benign_splits[2]],
            "telecom": [benign_splits[3]]
        }

        unique_attacks = sorted(list(attack_df['Label'].unique()))
        clients = ["bank", "hospital", "retail", "telecom"]

        for i, attack_label in enumerate(unique_attacks):
            group = attack_df[attack_df['Label'] == attack_label]
            assigned_client = clients[i % 4]
            partitions_data[assigned_client].append(group)
            logger.info(f"Routing attack '{attack_label}' ({len(group)} rows) -> Client: {assigned_client}")

        final_partitions = {}
        for client, df_list in partitions_data.items():
            final_partitions[client] = pd.concat(df_list, ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)
            logger.info(f"Partitioned Client '{client}': Total Rows={len(final_partitions[client])}")

        return final_partitions

def load_dataset(path_or_dir: str | Path = DEFAULT_DATASET_DIR) -> pd.DataFrame:
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

def split_into_clients(df: pd.DataFrame, strategy: str = "non_iid") -> Dict[str, pd.DataFrame]:
    if strategy == "non_iid":
        return ClientPartitioner.partition_non_iid(df)
    elif strategy == "iid":
        return ClientPartitioner.partition_iid(df)
    else:
        raise ValueError(f"Unknown split strategy: '{strategy}'")

def get_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    stats = {}
    stats["num_rows"] = int(len(df))
    stats["num_columns"] = int(df.shape[1])
    
    missing = df.isnull().sum()
    stats["missing_values"] = int(missing.sum())
    stats["missing_by_column"] = {str(k): int(v) for k, v in missing[missing > 0].items()}
    
    stats["duplicate_count"] = int(df.duplicated().sum())

    label_col = '_original_label' if '_original_label' in df.columns else ('Label' if 'Label' in df.columns else None)
    if label_col:
        dist = df[label_col].value_counts().to_dict()
        stats["label_distribution"] = {str(k): int(v) for k, v in dist.items()}
    else:
        stats["label_distribution"] = {}

    if 'target' in df.columns:
        target_dist = df['target'].value_counts().to_dict()
        stats["target_distribution"] = {int(k): int(v) for k, v in target_dist.items()}

    stats["memory_usage"] = float(df.memory_usage(deep=True).sum() / (1024 * 1024))

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
