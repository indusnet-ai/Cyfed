from abc import ABC, abstractmethod
from typing import List, Dict, Any
import numpy as np

class BaseModel(ABC):
    """
    Abstract Model Adapter interface that FedCore consumes.
    All machine learning, deep learning, or boosting models in domain packages
    must implement this interface to participate in federated aggregation.
    """
    
    @abstractmethod
    def get_parameters(self) -> List[np.ndarray]:
        """
        Retrieves the model parameters (weights, coefficients, biases, etc.) 
        as a list of NumPy arrays for federated aggregation.
        """
        pass
        
    @abstractmethod
    def set_parameters(self, parameters: List[np.ndarray]) -> None:
        """
        Loads the model parameters back into the model instance.
        """
        pass
        
    @abstractmethod
    def fit(self, X: Any, y: np.ndarray) -> Dict[str, float]:
        """
        Trains the local model on the provided data.
        Returns a dictionary of training metrics (e.g. loss, accuracy).
        """
        pass
        
    @abstractmethod
    def evaluate(self, X: Any, y: np.ndarray) -> Dict[str, float]:
        """
        Evaluates the model on the provided data.
        Returns a dictionary of metrics (e.g. loss, accuracy, precision, recall, f1).
        """
        pass
        
    @abstractmethod
    def predict(self, X: Any) -> np.ndarray:
        """
        Generates predictions for the input data.
        """
        pass
