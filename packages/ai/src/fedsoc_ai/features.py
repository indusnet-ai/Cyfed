import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.preprocessing import StandardScaler

class FeaturePipeline:
    """
    Feature pipeline for preparing network security events, system calls, 
    or log data into a format suitable for training XGBoost/Linear models.
    """
    def __init__(self, expected_features: List[str] | None = None):
        # Default security features if none provided
        self.expected_features = expected_features or [
            "duration",
            "protocol_type_encoded",
            "service_encoded",
            "flag_encoded",
            "src_bytes",
            "dst_bytes",
            "wrong_fragment",
            "hot",
            "num_failed_logins",
            "logged_in",
            "num_compromised",
            "root_shell",
            "su_attempted",
            "num_root",
            "num_file_creations",
            "num_shells",
            "num_access_files",
            "count",
            "srv_count"
        ]
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, df: pd.DataFrame) -> 'FeaturePipeline':
        """Fit preprocessing utilities (e.g. scalers)."""
        df_cleaned = self._clean_and_fill(df)
        df_features = self._align_features(df_cleaned)
        self.scaler.fit(df_features.to_numpy())
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform raw logs/data into preprocessed scaled features."""
        df_cleaned = self._clean_and_fill(df)
        df_features = self._align_features(df_cleaned)
        
        if not self.is_fitted:
            # Fallback fitting if not fitted
            self.fit(df)
            
        scaled_data = self.scaler.transform(df_features.to_numpy())
        return pd.DataFrame(scaled_data, columns=self.expected_features)

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.fit(df).transform(df)

    def _clean_and_fill(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values, encoding, and basic column cleaning."""
        df_copy = df.copy()
        
        # Categorical maps (mock encoding for security datasets like NSL-KDD/KDD99)
        protocol_map = {"tcp": 0, "udp": 1, "icmp": 2}
        service_map = {"http": 0, "smtp": 1, "ftp": 2, "dns": 3, "private": 4, "other": 5}
        flag_map = {"SF": 0, "S0": 1, "REJ": 2, "RSTR": 3, "SH": 4}

        if "protocol_type" in df_copy.columns:
            df_copy["protocol_type_encoded"] = df_copy["protocol_type"].map(protocol_map).fillna(5)
        if "service" in df_copy.columns:
            df_copy["service_encoded"] = df_copy["service"].map(service_map).fillna(10)
        if "flag" in df_copy.columns:
            df_copy["flag_encoded"] = df_copy["flag"].map(flag_map).fillna(15)

        # Handle numeric filling
        numeric_cols = df_copy.select_dtypes(include=[np.number]).columns
        df_copy[numeric_cols] = df_copy[numeric_cols].fillna(0)
        
        return df_copy

    def _align_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Ensure all expected features are present in the exact order."""
        aligned = pd.DataFrame()
        for col in self.expected_features:
            if col in df.columns:
                aligned[col] = df[col]
            else:
                aligned[col] = 0.0 # Missing column padding
        return aligned
