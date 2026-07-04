# FedCore Platform API Reference

**FedCore** is a reusable, domain-agnostic Federated Learning platform. This document describes the primary python classes and interfaces inside the package `fedcore`.

---

## 1. Class: `BaseModel`
- **Location**: `fedcore.federation.base_model`
- **Purpose**: Abstract model interface. All custom classifier models (e.g. PyTorch, XGBoost, Scikit-Learn) must subclass `BaseModel` to interface with FedCore.
- **Abstract Methods**:
  - `get_parameters() -> List[np.ndarray]`: Extract weights/biases.
  - `set_parameters(parameters: List[np.ndarray]) -> None`: Load weights/biases.
  - `fit(X, y) -> Dict[str, float]`: Fit the model on training data.
  - `evaluate(X, y) -> Dict[str, float]`: Compute performance metrics.
  - `predict(X) -> np.ndarray`: Perform class predictions.

---

## 2. Class: `FedCoreServer`
- **Location**: `fedcore.federation.server`
- **Purpose**: Controls the Flower server lifecycle.
- **Methods**:
  - `__init__(config: ServerConfig, model: BaseModel)`
  - `start() -> None`: Starts gRPC service listening on port 8080 and initiates training rounds.

---

## 3. Class: `FedCoreClient`
- **Location**: `fedcore.federation.client`
- **Purpose**: NumPyClient wrapper executing inside the local client environment.
- **Methods**:
  - `__init__(config: ClientConfig, model: BaseModel, load_data_fn)`
  - `start() -> None`: Establishes secure connection to Flower Server Coordinator.

---

## 4. Helper Modules

### 4.1 `strategy.py`
- Implements custom `FedAvg` aggregation hook logic to capture round metrics and report statuses to the Next.js API.

### 4.2 `checkpoint.py`
- Implements `CheckpointManager` that writes training round weights `.pkl` checkpoints and consolidates `metrics.json` telemetry.
