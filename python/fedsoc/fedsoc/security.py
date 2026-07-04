from typing import List, Dict, Any
import numpy as np
from loguru import logger

class SecurityAuditor:
    """
    Compliance and privacy verifier for federated learning transactions.
    """
    
    @staticmethod
    def audit_outgoing_parameters(parameters: List[np.ndarray]) -> bool:
        if not isinstance(parameters, list):
            logger.error("Security Audit FAILED: Outgoing parameters must be a list of NumPy arrays.")
            return False
            
        for i, arr in enumerate(parameters):
            if not isinstance(arr, np.ndarray):
                logger.error(f"Security Audit FAILED: Parameter layer {i} is not a NumPy ndarray.")
                return False
                
            if arr.dtype.kind not in ['f', 'i', 'u']:
                logger.error(f"Security Audit FAILED: Parameter layer {i} contains non-numeric datatype: {arr.dtype}")
                return False
                
            if arr.nbytes > 50 * 1024 * 1024:
                logger.error(f"Security Audit FAILED: Parameter layer {i} size exceeds security threshold (>50MB).")
                return False
                
        logger.info("Security Audit PASSED: Outgoing model parameters are privacy-compliant.")
        return True

    @staticmethod
    def audit_outgoing_metrics(metrics: Dict[str, Any]) -> bool:
        sensitive_blocklist = {"ip", "ip_address", "address", "payload", "raw", "packet", "flow_id", "timestamp", "mac"}
        
        for key, val in metrics.items():
            if any(block in key.lower() for block in sensitive_blocklist):
                logger.error(f"Security Audit FAILED: Sensitive keyword '{key}' detected in metrics keys.")
                return False
                
            if isinstance(val, (str, bytes)):
                if len(val) > 100:
                    logger.error(f"Security Audit FAILED: Large string/bytes detected in metrics key '{key}' (>100 chars).")
                    return False
                    
        logger.info("Security Audit PASSED: Outgoing metrics dictionary is privacy-compliant.")
        return True
