from pydantic import BaseModel as PydanticBaseModel, Field
from typing import Optional

class ServerConfig(PydanticBaseModel):
    """Configuration schema for the FedCore Flower server coordinator."""
    host: str = Field(default="0.0.0.0", description="IP address to listen on.")
    port: str = Field(default="8080", description="Port to run gRPC channel on.")
    rounds: int = Field(default=5, description="Number of federated learning rounds.")
    min_clients: int = Field(default=2, description="Minimum clients required for aggregation.")
    strategy: str = Field(default="fedavg", description="Aggregation strategy (fedavg, fedprox, etc.)")
    proximal_mu: float = Field(default=0.1, description="Proximal term constant mu for FedProx.")
    dashboard_api: Optional[str] = Field(default=None, description="Central coordinator Next.js dashboard URL.")
    checkpoint_dir: str = Field(default="artifacts/global", description="Output path for checkpoints.")

class ClientConfig(PydanticBaseModel):
    """Configuration schema for individual FedCore clients."""
    server_address: str = Field(default="localhost:8080", description="GRPC server address.")
    client_name: str = Field(..., description="Unique client identifier (e.g. bank, hospital).")
    epochs: int = Field(default=1, description="Local training epochs per FL round.")
    batch_size: int = Field(default=32, description="Local training batch size.")
    learning_rate: float = Field(default=0.01, description="Local training learning rate.")
    dashboard_api: Optional[str] = Field(default=None, description="Central coordinator Next.js dashboard URL.")
    artifact_dir: str = Field(default="artifacts", description="Local directory to write trained artifacts.")
