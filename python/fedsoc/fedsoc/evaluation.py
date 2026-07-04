from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, log_loss, confusion_matrix

def calculate_multiclass_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray, num_classes: int) -> Dict[str, float]:
    loss_val = float(log_loss(y_true, y_prob, labels=np.arange(num_classes)))
    
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average='macro', zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average='macro', zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, average='macro', zero_division=0)),
        "loss": loss_val
    }

def get_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray, num_classes: int) -> List[List[int]]:
    cm = confusion_matrix(y_true, y_pred, labels=np.arange(num_classes))
    return cm.tolist()
