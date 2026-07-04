import os
import time
import pickle
import json
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, roc_auc_score
from loguru import logger

from fedcore.federation.base_model import BaseModel
from fedsoc.models import SGDClassifierModel, XGBoostClassifierModel

# Constants
ROOT = Path("E:/CyberFed AI")
DEFAULT_CLIENTS_DIR = ROOT / "datasets" / "clients"
DEFAULT_ARTIFACTS_DIR = ROOT / "artifacts"

class LocalTrainer:
    """
    Manages loading, splitting, training, evaluating, and persisting
    machine learning model artifacts for simulated clients (FedSOC).
    """
    def __init__(self, client_name: str, model_type: str = "xgboost", num_classes: int = 15):
        self.client_name = client_name.lower()
        self.model_type = model_type.lower()
        self.num_classes = num_classes
        
        self.dataset_path = DEFAULT_CLIENTS_DIR / f"{self.client_name}.parquet"
        self.artifact_dir = DEFAULT_ARTIFACTS_DIR / self.client_name
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        
        self.model: BaseModel = self._init_model()
        
    def _init_model(self) -> BaseModel:
        if self.model_type == "sgd":
            return SGDClassifierModel(num_features=77, num_classes=self.num_classes)
        elif self.model_type == "xgboost":
            return XGBoostClassifierModel(num_classes=self.num_classes)
        else:
            raise ValueError(f"Unknown model type: '{self.model_type}'. Supported: 'sgd', 'xgboost'")
            
    def load_and_split(self, test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Client dataset parquet not found at: {self.dataset_path}")
            
        logger.info(f"[{self.client_name}] Loading preprocessed dataset from {self.dataset_path}")
        df = pd.read_parquet(self.dataset_path)
        
        X = df.drop(columns=["target", "_original_label"], errors="ignore")
        y = df["target"].to_numpy()
        
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, stratify=y, random_state=42
            )
            logger.info(f"[{self.client_name}] Completed stratified split.")
        except ValueError:
            logger.warning(f"[{self.client_name}] Stratified split failed. Falling back to standard split.")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
            
        return X_train, X_test, y_train, y_test

    def train_and_evaluate(self) -> Dict[str, Any]:
        X_train, X_test, y_train, y_test = self.load_and_split()
        
        logger.info(f"[{self.client_name}] Training {self.model_type} model on {len(X_train)} samples...")
        start_train = time.time()
        self.model.fit(X_train, y_train)
        training_time = time.time() - start_train
        logger.info(f"[{self.client_name}] Training completed in {training_time:.4f}s.")
        
        start_pred = time.time()
        y_pred = self.model.predict(X_test)
        prediction_time = time.time() - start_pred
        
        eval_metrics = self.model.evaluate(X_test, y_test)
        cm = confusion_matrix(y_test, y_pred, labels=np.arange(self.num_classes)).tolist()
        
        try:
            proba = self.model.predict_proba(X_test)
            roc_auc = float(roc_auc_score(y_test, proba, multi_class='ovr', average='macro', labels=np.arange(self.num_classes)))
        except Exception as e:
            logger.debug(f"[{self.client_name}] ROC-AUC OVR calculation skipped: {e}")
            roc_auc = 0.0

        metrics_report = {
            "client_name": self.client_name,
            "model_type": self.model_type,
            "dataset_size": len(X_train) + len(X_test),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "accuracy": eval_metrics["accuracy"],
            "precision": eval_metrics["precision"],
            "recall": eval_metrics["recall"],
            "f1_score": eval_metrics["f1_score"],
            "roc_auc": roc_auc,
            "confusion_matrix": cm,
            "training_time": training_time,
            "prediction_time": prediction_time,
            "dataset_version": "1.0.0",
            "model_version": "1.0.0",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        self.save_artifacts(metrics_report)
        return metrics_report

    def save_artifacts(self, metrics_report: Dict[str, Any]):
        model_path = self.artifact_dir / "model.pkl"
        metrics_path = self.artifact_dir / "metrics.json"
        scaler_path = self.artifact_dir / "scaler.pkl"
        
        logger.info(f"[{self.client_name}] Saving model to {model_path}")
        with open(model_path, "wb") as f:
            pickle.dump(self.model, f)
            
        logger.info(f"[{self.client_name}] Saving metrics to {metrics_path}")
        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(metrics_report, f, indent=2)

        logger.info(f"[{self.client_name}] Saving scaler to {scaler_path}")
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        if self.dataset_path.exists():
            df = pd.read_parquet(self.dataset_path)
            X = df.drop(columns=["target", "_original_label"], errors="ignore")
            numeric_cols = X.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                scaler.fit(X[numeric_cols])
        with open(scaler_path, "wb") as f:
            pickle.dump(scaler, f)

    def load_artifacts(self) -> Tuple[BaseModel, Dict[str, Any]]:
        model_path = self.artifact_dir / "model.pkl"
        metrics_path = self.artifact_dir / "metrics.json"
        
        if not model_path.exists() or not metrics_path.exists():
            raise FileNotFoundError(f"Model or metrics artifacts missing for client '{self.client_name}' under: {self.artifact_dir}")
            
        with open(model_path, "rb") as f:
            model = pickle.load(f)
            
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics = json.load(f)
            
        return model, metrics
