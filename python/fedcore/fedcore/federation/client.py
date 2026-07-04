import time
from typing import Tuple, Dict, Any, Callable
from loguru import logger
import httpx
import numpy as np

import flwr as fl
from fedcore.federation.config import ClientConfig
from fedcore.federation.base_model import BaseModel
from fedcore.federation.registry import ClientRegistry
from fedcore.federation.transport import TransportConfigurator

class FedCoreClient(fl.client.NumPyClient):
    """
    Generic Flower NumPyClient runtime (FedCore).
    Completely decoupled from domain models or dataset schemas.
    Communicates strictly with BaseModel interface and uses data loading hooks.
    """
    def __init__(
        self,
        config: ClientConfig,
        model: BaseModel,
        train_data_loader_fn: Callable[[], Tuple[Any, np.ndarray]],
        eval_data_loader_fn: Callable[[], Tuple[Any, np.ndarray]]
    ):
        self.config = config
        self.model = model
        self.train_data_loader_fn = train_data_loader_fn
        self.eval_data_loader_fn = eval_data_loader_fn
        
        # Local registry reporter
        self.registry = ClientRegistry(self.config.dashboard_api)
        
        # Cache datasets to avoid repetitive parquet reads
        self.X_train = None
        self.y_train = None
        self.X_test = None
        self.y_test = None
        
    def _lazy_load_data(self):
        """Loads train and test partitions once."""
        if self.X_train is None or self.y_train is None:
            logger.info(f"[{self.config.client_name}] Loading training partition data...")
            self.X_train, self.y_train = self.train_data_loader_fn()
            
        if self.X_test is None or self.y_test is None:
            logger.info(f"[{self.config.client_name}] Loading validation partition data...")
            self.X_test, self.y_test = self.eval_data_loader_fn()

    def get_parameters(self, config: Dict[str, Any]) -> list[np.ndarray]:
        """Retrieves parameters from the abstract model."""
        return self.model.get_parameters()

    def fit(self, parameters: list[np.ndarray], config: Dict[str, Any]) -> Tuple[list[np.ndarray], int, Dict[str, Any]]:
        """Fits model on local dataset partition and returns updated parameters."""
        logger.info(f"[{self.config.client_name}] Fit round started. Setting global model weights...")
        self.model.set_parameters(parameters)
        
        # Send training heartbeat update to registry
        self.registry.register_client(
            client_id=self.config.client_name,
            client_name=self.config.client_name.upper(),
            ip_address="127.0.0.1",
            dataset_size=len(self.X_train) if self.X_train is not None else 0,
            status="training"
        )
        
        self._lazy_load_data()
        
        start_time = time.time()
        metrics = self.model.fit(self.X_train, self.y_train)
        fit_duration = time.time() - start_time
        
        metrics["local_fit_duration"] = fit_duration
        logger.info(f"[{self.config.client_name}] Local training completed in {fit_duration:.4f}s. Loss={metrics.get('loss', 0.0):.4f}")
        
        # Restore heartbeat status to online
        self.registry.register_client(
            client_id=self.config.client_name,
            client_name=self.config.client_name.upper(),
            ip_address="127.0.0.1",
            dataset_size=len(self.X_train),
            status="online"
        )
        
        return self.model.get_parameters(), len(self.X_train), metrics

    def evaluate(self, parameters: list[np.ndarray], config: Dict[str, Any]) -> Tuple[float, int, Dict[str, Any]]:
        """Evaluates global model parameters on the local validation partition."""
        logger.info(f"[{self.config.client_name}] Evaluation round started. Setting global model weights...")
        self.model.set_parameters(parameters)
        
        self._lazy_load_data()
        
        metrics = self.model.evaluate(self.X_test, self.y_test)
        loss = float(metrics.get("loss", 4.0))
        
        logger.info(f"[{self.config.client_name}] Local evaluation complete. Accuracy={metrics.get('accuracy', 0.0):.4f}, Loss={loss:.4f}")
        return loss, len(self.X_test), metrics

    def start(self):
        """Bootstraps client connection to the central gRPC coordinator."""
        logger.info(f"[{self.config.client_name}] Starting NumPyClient connection to server: {self.config.server_address}")
        
        # Load local partition data size to perform initial registration heartbeat
        self._lazy_load_data()
        
        self.registry.register_client(
            client_id=self.config.client_name,
            client_name=self.config.client_name.upper(),
            ip_address="127.0.0.1",
            dataset_size=len(self.X_train),
            status="online"
        )
        
        # Run NumPy Client connection
        fl.client.start_numpy_client(
            server_address=self.config.server_address,
            client=self,
            grpc_max_message_length=100 * 1024 * 1024 # 100MB
        )
