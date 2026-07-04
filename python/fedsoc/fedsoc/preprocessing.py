import os
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from loguru import logger

# Constants
ROOT = Path("E:/CyberFed AI")
DEFAULT_CLIENTS_DIR = ROOT / "datasets" / "clients"

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
        
        if 'Label' in df_copy.columns:
            df_copy['Label'] = df_copy['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip()
        
        initial_rows = len(df_copy)
        df_copy.drop_duplicates(inplace=True)
        dropped_dups = initial_rows - len(df_copy)
        if dropped_dups > 0:
            logger.info(f"Removed {dropped_dups} duplicate rows.")

        df_copy.replace([np.inf, -np.inf], np.nan, inplace=True)

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

        if self.mapping_path.exists():
            logger.info(f"Loading pre-shared label mapping from: {self.mapping_path}")
            with open(self.mapping_path, 'r', encoding='utf-8') as f:
                self.label_mapping = json.load(f)
        else:
            logger.info(f"Label mapping not found at {self.mapping_path}. Fitting labels dynamically...")
            unique_labels = df_clean['Label'].unique()
            sorted_labels = sorted(unique_labels, key=lambda l: (str(l).upper() != 'BENIGN', str(l)))
            self.label_mapping = {str(label): idx for idx, label in enumerate(sorted_labels)}
            
            self.mapping_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.mapping_path, 'w', encoding='utf-8') as f:
                json.dump(self.label_mapping, f, indent=2)
            logger.info(f"Saved Label Mapping: {self.label_mapping} to {self.mapping_path}")

        self.inverse_label_mapping = {idx: label for label, idx in self.label_mapping.items()}

        ignore_cols = {'Label', 'Flow ID', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port', 'Timestamp', 'target', '_original_label'}
        self.numeric_features = [col for col in df_clean.columns if col not in ignore_cols and pd.api.types.is_numeric_dtype(df_clean[col])]
        
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

        df_clean['target'] = df_clean['_original_label'].map(self.label_mapping)
        df_clean['target'] = df_clean['target'].fillna(1).astype(int)

        if self.numeric_features:
            scaled_vals = self.scaler.transform(df_clean[self.numeric_features].to_numpy())
            df_clean[self.numeric_features] = scaled_vals

        df_clean.drop(columns=['Label'], errors='ignore', inplace=True)
        return df_clean

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fits the pipeline locally and transforms raw data in one step."""
        return self.fit(df).transform(df)

def preprocess(df: pd.DataFrame, mapping_path: Optional[Path] = None) -> pd.DataFrame:
    """Runs local preprocessor (imputation, local scaling, multi-class encoding) on client data."""
    preprocessor = CICIDS2017Preprocessor(mapping_path=mapping_path)
    return preprocessor.fit_transform(df)
