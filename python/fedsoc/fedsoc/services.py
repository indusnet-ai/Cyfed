import httpx
from loguru import logger
from typing import Dict, Any, Optional

class FedSocDashboardService:
    """
    Service layer providing domain-specific API interfaces to post status updates.
    """
    def __init__(self, dashboard_url: Optional[str] = None):
        self.dashboard_url = dashboard_url

    def report_node_status(
        self, 
        node_id: str, 
        status: str, 
        dataset_size: int = 0, 
        ip_address: str = "127.0.0.1"
    ) -> bool:
        if not self.dashboard_url:
            return False
            
        try:
            url = f"{self.dashboard_url}/api/federation/nodes?id={node_id}"
            payload = {
                "name": node_id.upper(),
                "type": "organization",
                "status": status,
                "ipAddress": ip_address,
                "datasetSize": dataset_size
            }
            response = httpx.post(url, json=payload, timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to post node heartbeat to dashboard: {e}")
            return False
