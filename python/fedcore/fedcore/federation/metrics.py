from typing import List, Dict, Any, Tuple
from loguru import logger
import flwr as fl

class MetricsManager:
    """
    Manager for computing, logging, and reporting federated training metrics.
    """
    
    @staticmethod
    def aggregate_fit_metrics(metrics: List[Tuple[int, Dict[str, fl.common.Scalar]]]) -> Dict[str, fl.common.Scalar]:
        if not metrics:
            return {}
            
        total_examples = sum(num_examples for num_examples, _ in metrics)
        if total_examples == 0:
            return {}
            
        aggregated: Dict[str, fl.common.Scalar] = {}
        
        for num_examples, m in metrics:
            weight = num_examples / total_examples
            for key, val in m.items():
                try:
                    float_val = float(val)
                    aggregated[key] = aggregated.get(key, 0.0) + float_val * weight
                except (ValueError, TypeError):
                    if key not in aggregated:
                        aggregated[key] = val
                        
        logger.info(f"Aggregated Fit Metrics: { {k: f'{v:.4f}' if isinstance(v, float) else v for k, v in aggregated.items()} }")
        return aggregated

    @staticmethod
    def aggregate_evaluate_metrics(metrics: List[Tuple[int, Dict[str, fl.common.Scalar]]]) -> Dict[str, fl.common.Scalar]:
        if not metrics:
            return {}
            
        total_examples = sum(num_examples for num_examples, _ in metrics)
        if total_examples == 0:
            return {}
            
        aggregated: Dict[str, fl.common.Scalar] = {}
        
        for num_examples, m in metrics:
            weight = num_examples / total_examples
            for key, val in m.items():
                try:
                    float_val = float(val)
                    aggregated[key] = aggregated.get(key, 0.0) + float_val * weight
                except (ValueError, TypeError):
                    if key not in aggregated:
                        aggregated[key] = val
                        
        logger.info(f"Aggregated Eval Metrics: { {k: f'{v:.4f}' if isinstance(v, float) else v for k, v in aggregated.items()} }")
        return aggregated
