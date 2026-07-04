import numpy as np
import pandas as pd
import json
from typing import Dict, Any, List, Tuple
from abc import ABC, abstractmethod
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, log_loss
import xgboost as xgb
from loguru import logger

class BaseModel(ABC):
    """
    Abstract interface for local classifier models.
    Unifies local predictions and federated weight exchange interfaces.
    """
    
    @abstractmethod
    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """Train the model locally and return training metrics."""
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Predict class labels for the inputs."""
        pass

    @abstractmethod
    def predict_proba(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        """Predict class probabilities for the inputs."""
        pass
        
    @abstractmethod
    def get_weights(self) -> List[np.ndarray]:
        """Retrieve model parameters/weights for federated aggregation."""
        pass

    @abstractmethod
    def set_weights(self, weights: List[np.ndarray]) -> None:
        """Assign aggregated model parameters/weights."""
        pass

    @abstractmethod
    def evaluate(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """Evaluate the model and return metrics."""
        pass


class FederatedModel(BaseModel):
    """Base class for compatibility with existing federated wrappers."""
    pass


class SGDClassifierModel(BaseModel):
    """
    Multiclass classification baseline model using Stochastic Gradient Descent (SGD).
    Supports partial_fit for warm-starting and streaming federated updates.
    """
    def __init__(self, num_features: int, num_classes: int = 2, loss: str = 'log_loss'):
        self.num_features = num_features
        self.num_classes = num_classes
        self.model = SGDClassifier(loss=loss, warm_start=True, max_iter=1, tol=1e-3, random_state=42)
        
        # Pre-initialize weights (binary shape is 1D/2D coef_, multiclass is num_classes x num_features)
        if num_classes == 2:
            self.model.classes_ = np.array([0, 1])
            self.model.coef_ = np.zeros((1, num_features))
            self.model.intercept_ = np.zeros((1,))
        else:
            self.model.classes_ = np.arange(num_classes)
            self.model.coef_ = np.zeros((num_classes, num_features))
            self.model.intercept_ = np.zeros((num_classes,))

    def get_weights(self) -> List[np.ndarray]:
        return [self.model.coef_.copy(), self.model.intercept_.copy()]

    def set_weights(self, weights: List[np.ndarray]) -> None:
        if len(weights) >= 2:
            self.model.coef_ = weights[0].copy()
            self.model.intercept_ = weights[1].copy()

    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else X
        # Fit using partial_fit to support online learning across rounds
        self.model.partial_fit(X_arr, y, classes=np.arange(self.num_classes))
        return self.evaluate(X, y)

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else X
        return self.model.predict(X_arr)

    def predict_proba(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else X
        return self.model.predict_proba(X_arr)

    def evaluate(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else X
        preds = self.predict(X_arr)
        proba = self.predict_proba(X_arr)
        
        # Compute multiclass log loss
        loss_val = float(log_loss(y, proba, labels=np.arange(self.num_classes)))
        
        return {
            "loss": loss_val,
            "accuracy": float(accuracy_score(y, preds)),
            "precision": float(precision_score(y, preds, average='macro', zero_division=0)),
            "recall": float(recall_score(y, preds, average='macro', zero_division=0)),
            "f1Score": float(f1_score(y, preds, average='macro', zero_division=0))
        }


class XGBoostClassifierModel(BaseModel):
    """
    Primary multiclass classifier using XGBoost.
    Optimized for high-performance localized intrusion detection.
    Maps local non-consecutive targets to consecutive indexes 0..C-1 to bypass XGBoost constraints.
    """
    def __init__(self, num_classes: int = 2, max_depth: int = 6, learning_rate: float = 0.3, n_estimators: int = 100):
        self.num_classes = num_classes
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.n_estimators = n_estimators
        
        self.model = None
        self.is_trained = False
        self.classes_map: List[int] = []

    def _init_booster(self, num_local_classes: int):
        objective = 'binary:logistic' if num_local_classes == 2 else 'multi:softprob'
        self.model = xgb.XGBClassifier(
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            n_estimators=self.n_estimators,
            objective=objective,
            num_class=None if num_local_classes == 2 else num_local_classes,
            eval_metric='logloss' if num_local_classes == 2 else 'mlogloss',
            random_state=42
        )

    def get_weights(self) -> List[np.ndarray]:
        if not self.is_trained:
            return [np.array([])]
        model_bytes = self.model.save_raw(raw_format='json')
        # Include classes_map inside weights so serialization is complete
        map_arr = np.array(self.classes_map, dtype=np.int32)
        return [np.frombuffer(model_bytes, dtype=np.uint8), map_arr]

    def set_weights(self, weights: List[np.ndarray]) -> None:
        if len(weights) > 0 and len(weights[0]) > 0:
            model_bytes = weights[0].tobytes()
            # If classes_map was sent in weights, restore it
            if len(weights) >= 2:
                self.classes_map = list(weights[1].astype(int))
                num_local_classes = len(self.classes_map)
            else:
                self.classes_map = list(range(self.num_classes))
                num_local_classes = self.num_classes
                
            self._init_booster(num_local_classes)
            self.model.load_model(model_bytes)
            self.is_trained = True

    def fit(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        # Determine unique classes present locally and sort
        unique_y = np.unique(y)
        self.classes_map = sorted(list(unique_y))
        num_local_classes = len(self.classes_map)
        
        # Initialize booster on consecutive target space 0..C-1
        self._init_booster(num_local_classes)
        
        # Map targets to consecutive space
        global_to_local = {val: idx for idx, val in enumerate(self.classes_map)}
        y_local = np.array([global_to_local[val] for val in y])
        
        self.model.fit(X, y_local)
        self.is_trained = True
        return self.evaluate(X, y)

    def predict(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if not self.is_trained or not self.classes_map:
            X_len = len(X) if hasattr(X, "__len__") else X.shape[0]
            return np.zeros(X_len)
            
        preds_local = self.model.predict(X)
        # If predict returns probabilities (2D array), convert to argmax
        if len(preds_local.shape) > 1 and preds_local.shape[1] > 1:
            preds_local = preds_local.argmax(axis=1)
            
        # Map local predictions back to global labels
        preds_global = np.array([self.classes_map[idx] for idx in preds_local])
        return preds_global

    def predict_proba(self, X: pd.DataFrame | np.ndarray) -> np.ndarray:
        if not self.is_trained or not self.classes_map:
            X_len = len(X) if hasattr(X, "__len__") else X.shape[0]
            equal_probs = np.ones((X_len, self.num_classes)) / self.num_classes
            return equal_probs
            
        proba_local = self.model.predict_proba(X)
        # If binary booster predicts probability of class 1 as shape (N,), expand to (N, 2)
        if len(proba_local.shape) == 1 or proba_local.shape[1] == 1:
            proba_local = proba_local.reshape(-1, 1)
            proba_local = np.hstack([1.0 - proba_local, proba_local])
            
        # Reconstruct global probability distribution of shape (N, num_classes)
        X_len = len(X) if hasattr(X, "__len__") else X.shape[0]
        proba_global = np.zeros((X_len, self.num_classes))
        for local_idx, global_val in enumerate(self.classes_map):
            if global_val < self.num_classes:
                proba_global[:, global_val] = proba_local[:, local_idx]
                
        return proba_global

    def evaluate(self, X: pd.DataFrame | np.ndarray, y: np.ndarray) -> Dict[str, float]:
        X_arr = X.to_numpy() if isinstance(X, pd.DataFrame) else X
        if not self.is_trained:
            return {"loss": 4.0, "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1Score": 0.0}
        
        preds = self.predict(X_arr)
        proba = self.predict_proba(X_arr)
        loss_val = float(log_loss(y, proba, labels=np.arange(self.num_classes)))
        
        return {
            "loss": loss_val,
            "accuracy": float(accuracy_score(y, preds)),
            "precision": float(precision_score(y, preds, average='macro', zero_division=0)),
            "recall": float(recall_score(y, preds, average='macro', zero_division=0)),
            "f1Score": float(f1_score(y, preds, average='macro', zero_division=0))
        }


# Aliases for backward compatibility
SGDLinearModel = SGDClassifierModel
XGBoostModel = XGBoostClassifierModel
