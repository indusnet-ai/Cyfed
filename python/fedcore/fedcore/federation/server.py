import time
from typing import Optional, List, Dict, Any
from pathlib import Path
import numpy as np
from loguru import logger

import flwr as fl
from flwr.common import ndarrays_to_parameters

from fedcore.federation.config import ServerConfig
from fedcore.federation.base_model import BaseModel
from fedcore.federation.strategy import FedCoreStrategy
from fedcore.federation.checkpoint import CheckpointManager
from fedcore.federation.registry import ClientRegistry
from fedcore.federation.transport import TransportConfigurator

class FedCoreServer:
    """
    Central Coordinator Server for Federated Learning (FedCore).
    Manages client registries, aggregation strategies, rounds orchestration, 
    and checkpoint persistence. Completely domain-agnostic.
    """
    def __init__(self, config: ServerConfig, initial_model: BaseModel):
        self.config = config
        self.model = initial_model
        
        self.checkpoint_manager = CheckpointManager(self.config.checkpoint_dir)
        self.registry = ClientRegistry(self.config.dashboard_api)
        
        # Load initial weights for parameter initialization
        self.initial_parameters = ndarrays_to_parameters(self.model.get_parameters())
        
    def _on_round_completed(self, round_num: int, parameters: List[np.ndarray], metrics: Dict[str, Any]):
        """Callback triggered after weight aggregation completed in each round."""
        logger.info(f"Coordinator: Round {round_num} completed successfully.")
        
        # Update our server model adapter with aggregated parameters
        self.model.set_parameters(parameters)
        
        # Save model checkpoint pkl to artifacts/global/
        checkpoint_path = self.checkpoint_manager.save_checkpoint(
            round_num=round_num,
            parameters=parameters,
            metrics=metrics
        )
        
        # Post global model version details to Next.js API if dashboard is active
        if self.config.dashboard_api:
            self._report_global_model_to_dashboard(round_num, metrics, checkpoint_path)

    def _report_global_model_to_dashboard(self, round_num: int, metrics: Dict[str, Any], checkpoint_path: Path):
        """Posts global model updates to Supabase global_models table."""
        try:
            import httpx
            url = f"{self.config.dashboard_api}/api/federation/global-model"
            payload = {
                "version": f"1.0.{round_num}",
                "checkpointPath": str(checkpoint_path.resolve()),
                "accuracy": float(metrics.get("accuracy", 0.0)),
                "loss": float(metrics.get("loss", 0.0)),
                "precision": float(metrics.get("precision", 0.0)),
                "recall": float(metrics.get("recall", 0.0)),
                "f1": float(metrics.get("f1_score", 0.0)),
                "roundNumber": round_num
            }
            logger.info(f"Reporting global model round {round_num} to Next.js API...")
            httpx.post(url, json=payload, timeout=5.0)
        except Exception as e:
            logger.error(f"Failed to post global model metadata to dashboard: {e}")

    def start(self):
        """Starts the Flower coordination GRPC server listener."""
        server_address = f"{self.config.host}:{self.config.port}"
        logger.info(f"Starting FedCore Server coordinator on {server_address}")
        
        # Instantiate strategy
        strategy = FedCoreStrategy(
            dashboard_url=self.config.dashboard_api,
            on_round_completed_fn=self._on_round_completed,
            fraction_fit=1.0,
            fraction_evaluate=1.0,
            min_fit_clients=self.config.min_clients,
            min_evaluate_clients=self.config.min_clients,
            min_available_clients=self.config.min_clients,
            initial_parameters=self.initial_parameters,
        )
        
        grpc_options = TransportConfigurator.get_grpc_server_options()
        
        # Launch Flower server loop
        fl.server.start_server(
            server_address=server_address,
            config=fl.server.ServerConfig(num_rounds=self.config.rounds),
            strategy=strategy,
            grpc_max_message_length=100 * 1024 * 1024 # 100MB
        )
