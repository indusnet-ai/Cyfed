from typing import Dict, Any, List
import time
from loguru import logger
import httpx

class ClientRegistry:
    def __init__(self, dashboard_url: str = None):
        self.dashboard_url = dashboard_url
        self.local_registry: Dict[str, Dict[str, Any]] = {}
        
    def register_client(
        self, 
        client_id: str, 
        client_name: str, 
        ip_address: str, 
        dataset_size: int, 
        status: str = "online"
    ) -> bool:
        timestamp = time.time()
        self.local_registry[client_id] = {
            "name": client_name,
            "ip_address": ip_address,
            "dataset_size": dataset_size,
            "status": status,
            "last_active": timestamp
        }
        
        logger.info(f"Registered client: {client_name} (ID: {client_id}, IP: {ip_address}, Size: {dataset_size})")
        
        if self.dashboard_url:
            try:
                url = f"{self.dashboard_url}/api/nodes?id={client_id}"
                # Map client_name profile into valid Zod types, and status 'online' to 'idle'
                valid_type = client_name.lower() if client_name.lower() in ['bank', 'hospital', 'retail', 'telecom'] else 'generic'
                valid_status = "idle" if status == "online" else status
                
                payload = {
                    "name": f"Nova-{client_name.capitalize()}-Node",
                    "type": valid_type,
                    "status": valid_status,
                    "ipAddress": ip_address if ip_address != "localhost" else "127.0.0.1",
                    "datasetSize": dataset_size
                }
                response = httpx.post(url, json=payload, timeout=5.0)
                if response.status_code == 200:
                    logger.debug(f"Successfully posted registration of node {client_name} to dashboard.")
                    return True
                else:
                    logger.warning(f"Dashboard node registration responded with code {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Failed to post node registration to dashboard: {e}")
                
        return False

    def update_heartbeat(self, client_id: str, status: str = "online") -> bool:
        if client_id in self.local_registry:
            self.local_registry[client_id]["last_active"] = time.time()
            self.local_registry[client_id]["status"] = status
            
            client_name = self.local_registry[client_id]["name"]
            ip_address = self.local_registry[client_id]["ip_address"]
            dataset_size = self.local_registry[client_id]["dataset_size"]
            
            return self.register_client(client_id, client_name, ip_address, dataset_size, status)
        return False

    def get_active_clients(self) -> List[Dict[str, Any]]:
        now = time.time()
        active = []
        for cid, info in self.local_registry.items():
            if now - info["last_active"] < 60:
                active.append({"id": cid, **info})
        return active
