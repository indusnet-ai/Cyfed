import time
from typing import List, Tuple, Dict, Any, Optional, Callable
from loguru import logger
import httpx
import numpy as np

import flwr as fl
from flwr.common import (
    Parameters, FitRes, EvaluateRes, Scalar, 
    parameters_to_ndarrays, ndarrays_to_parameters
)
from flwr.server.client_proxy import ClientProxy

from fedcore.federation.metrics import MetricsManager
from fedcore.federation.aggregation import aggregate_parameters

class FedCoreStrategy(fl.server.strategy.FedAvg):
    """
    Generic reusable FL strategy extending Flower's FedAvg.
    Decoupled from domain logic. Calls hooks for database upserts and model checkpointing.
    """
    def __init__(
        self,
        dashboard_url: Optional[str] = None,
        on_round_completed_fn: Optional[Callable[[int, List[np.ndarray], Dict[str, Any]], None]] = None,
        *args,
        **kwargs
    ):
        kwargs["fit_metrics_aggregation_fn"] = MetricsManager.aggregate_fit_metrics
        kwargs["evaluate_metrics_aggregation_fn"] = MetricsManager.aggregate_evaluate_metrics
        
        super().__init__(*args, **kwargs)
        self.dashboard_url = dashboard_url
        self.on_round_completed_fn = on_round_completed_fn
        self.round_start_time = 0.0

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[ClientProxy, FitRes]],
        failures: List[BaseException],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        agg_start_time = time.time()
        
        results_ndarrays = [
            (parameters_to_ndarrays(fit_res.parameters), fit_res.num_examples)
            for _, fit_res in results
        ]
        
        if not results_ndarrays:
            return None, {}
            
        aggregated_ndarrays = aggregate_parameters(results_ndarrays)
        aggregated_parameters = ndarrays_to_parameters(aggregated_ndarrays)
        
        metrics_aggregated = self.fit_metrics_aggregation_fn(
            [(fit_res.num_examples, fit_res.metrics) for _, fit_res in results]
        )
        
        aggregation_time = time.time() - agg_start_time
        round_duration = time.time() - self.round_start_time
        
        metrics_aggregated["round_duration"] = round_duration
        metrics_aggregated["aggregation_time"] = aggregation_time
        metrics_aggregated["active_clients_count"] = len(results)
        
        logger.info(f"Round {server_round} aggregated: Loss={metrics_aggregated.get('loss', 0.0):.4f}, Acc={metrics_aggregated.get('accuracy', 0.0):.4f}")
        
        if self.on_round_completed_fn:
            try:
                meta_metrics = {k: float(v) if isinstance(v, (int, float, np.number)) else v for k, v in metrics_aggregated.items()}
                self.on_round_completed_fn(server_round, aggregated_ndarrays, meta_metrics)
            except Exception as e:
                logger.error(f"Failed executing round completion callback: {e}")
                
        if self.dashboard_url:
            self._report_round_to_dashboard(server_round, metrics_aggregated, results)
            
        return aggregated_parameters, metrics_aggregated

    def configure_fit(
        self, server_round: int, parameters: Parameters, client_manager: fl.server.client_manager.ClientManager
    ) -> List[Tuple[ClientProxy, fl.common.FitIns]]:
        self.round_start_time = time.time()
        return super().configure_fit(server_round, parameters, client_manager)

    def _report_round_to_dashboard(
        self, 
        server_round: int, 
        metrics: Dict[str, Scalar], 
        results: List[Tuple[ClientProxy, FitRes]]
    ):
        try:
            url = f"{self.dashboard_url}/api/federation/rounds"
            payload = {
                "round": server_round,
                "accuracy": float(metrics.get("accuracy", 0.0)),
                "loss": float(metrics.get("loss", 0.0)),
                "precision": float(metrics.get("precision", 0.0)),
                "recall": float(metrics.get("recall", 0.0)),
                "f1": float(metrics.get("f1_score", 0.0)),
                "duration": float(metrics.get("round_duration", 0.0)),
                "aggregationTime": float(metrics.get("aggregation_time", 0.0)),
                "participatingNodes": [client.cid for client, _ in results]
            }
            logger.info(f"Reporting round {server_round} statistics to Next.js API: {self.dashboard_url}")
            httpx.post(url, json=payload, timeout=5.0)
        except Exception as e:
            logger.error(f"Failed to post round metrics to dashboard: {e}")
