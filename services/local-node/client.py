import argparse
import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from loguru import logger

from fedcore.federation.config import ClientConfig
from fedcore.federation.client import FedCoreClient
from fedsoc.models import SGDClassifierModel, XGBoostClassifierModel

# Constants
ROOT = Path("E:/CyberFed AI")
DEFAULT_CLIENTS_DIR = ROOT / "datasets" / "clients"

def main():
    parser = argparse.ArgumentParser(description="FedSOC AI Local Node Client")
    parser.add_argument("--server", type=str, default="localhost:8080", help="Flower server address")
    parser.add_argument("--dashboard-api", type=str, default="http://localhost:3000", help="Dashboard API root")
    parser.add_argument("--profile", type=str, default="bank", choices=["bank", "hospital", "retail", "telecom"], help="Node security profile")
    parser.add_argument("--model-type", type=str, default="sgd", choices=["sgd", "xgboost"], help="ML model type to train")
    
    args = parser.parse_args()
    client_name = args.profile.lower()
    
    logger.info(f"Initializing Local Node Client for profile: {client_name.upper()} (Model: {args.model_type.upper()})")
    
    # 1. Initialize Client Configuration
    config = ClientConfig(
        server_address=args.server,
        client_name=client_name,
        dashboard_api=args.dashboard_api
    )
    
    # 2. Define data loading closures/callbacks
    dataset_path = DEFAULT_CLIENTS_DIR / f"{client_name}.parquet"
    if not dataset_path.exists():
        logger.critical(f"Client dataset not found at: {dataset_path}")
        sys.exit(1)
        
    # Read the full dataset once to get feature dimensions for initialization
    df = pd.read_parquet(dataset_path)
    X = df.drop(columns=["target", "_original_label"], errors="ignore")
    num_features = X.shape[1]
    
    def train_data_loader():
        df_local = pd.read_parquet(dataset_path)
        X_local = df_local.drop(columns=["target", "_original_label"], errors="ignore")
        y_local = df_local["target"].to_numpy()
        # Stratified train/test split
        try:
            X_tr, _, y_tr, _ = train_test_split(
                X_local, y_local, test_size=0.2, stratify=y_local, random_state=42
            )
        except ValueError:
            X_tr, _, y_tr, _ = train_test_split(
                X_local, y_local, test_size=0.2, random_state=42
            )
        return X_tr, y_tr

    def eval_data_loader():
        df_local = pd.read_parquet(dataset_path)
        X_local = df_local.drop(columns=["target", "_original_label"], errors="ignore")
        y_local = df_local["target"].to_numpy()
        try:
            _, X_te, _, y_te = train_test_split(
                X_local, y_local, test_size=0.2, stratify=y_local, random_state=42
            )
        except ValueError:
            _, X_te, _, y_te = train_test_split(
                X_local, y_local, test_size=0.2, random_state=42
            )
        return X_te, y_te

    # 3. Instantiate the Model Adapter
    if args.model_type == "sgd":
        model = SGDClassifierModel(num_features=num_features, num_classes=15)
    elif args.model_type == "xgboost":
        model = XGBoostClassifierModel(num_classes=15)
    else:
        raise ValueError(f"Unsupported model type: {args.model_type}")
        
    # 4. Initialize and start the FedCore NumPyClient connection runtime
    client = FedCoreClient(
        config=config,
        model=model,
        train_data_loader_fn=train_data_loader,
        eval_data_loader_fn=eval_data_loader
    )
    client.start()

if __name__ == "__main__":
    main()
