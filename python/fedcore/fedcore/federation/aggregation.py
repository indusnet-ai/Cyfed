from typing import List, Tuple, Dict, Any
import numpy as np
from loguru import logger

def aggregate_parameters(results: List[Tuple[List[np.ndarray], int]]) -> List[np.ndarray]:
    """
    Computes standard FedAvg (weighted average) on model parameters.
    """
    if not results:
        return []
        
    total_examples = sum(num_examples for _, num_examples in results)
    if total_examples == 0:
        logger.warning("Total training examples across clients is 0. Returning parameters from first client.")
        return results[0][0]
        
    logger.info(f"Aggregating weights using FedAvg from {len(results)} clients (total samples: {total_examples})")
    
    first_parameters = results[0][0]
    weighted_weights = [np.zeros_like(w) for w in first_parameters]
    
    for local_params, num_examples in results:
        if len(local_params) != len(first_parameters):
            logger.error(f"Incompatible parameter shapes detected: expected {len(first_parameters)} layers, got {len(local_params)}")
            continue
            
        weight = num_examples / total_examples
        for i in range(len(local_params)):
            weighted_weights[i] += local_params[i] * weight
            
    return weighted_weights
