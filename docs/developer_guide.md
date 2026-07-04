# Developer Guide

Welcome to the CyberFed AI developer guide. This guide explains how to set up your local development environment, build the project packages, run tests, and develop new features on top of the FedCore platform.

---

## 1. Prerequisites

- **Python**: Version 3.10 or newer (tested on 3.14).
- **Node.js**: Version 18 or newer (for the dashboard).
- **uv**: The ultra-fast Python package manager.
  - Install via: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`

---

## 2. Environment Setup

Clone the repository and run setup to bootstrap virtual environments:

```powershell
# Install fedcore package in editable mode
uv pip install -e python/fedcore

# Install fedsoc package in editable mode
uv pip install -e python/fedsoc
```

To initialize dependencies for services:
```powershell
uv run --project services/flower-server python -c "import flwr"
uv run --project services/local-node python -c "import flwr"
```

---

## 3. Launching Federated Training Locally

To simulate training across client silos on your local developer machine:

### Step 1: Start the Flower Server Coordinator
```powershell
uv run --project services/flower-server python services/flower-server/server.py --rounds 3 --min-clients 4
```

### Step 2: Spawn the 4 Clients (in separate terminals)
```powershell
# Terminal 1: Bank
uv run --project services/local-node python services/local-node/client.py --profile bank

# Terminal 2: Hospital
uv run --project services/local-node python services/local-node/client.py --profile hospital

# Terminal 3: Retail
uv run --project services/local-node python services/local-node/client.py --profile retail

# Terminal 4: Telecom
uv run --project services/local-node python services/local-node/client.py --profile telecom
```

---

## 4. Running Automated Tests

We use `pytest` for all unit testing.

### 4.1 Running Federation and Preprocessing Tests
```powershell
uv run --project python/fedsoc pytest python/fedsoc/fedsoc/tests/
```

### 4.2 Running Legacy AI Tests
```powershell
uv run --project packages/ai pytest packages/ai/tests/
```

---

## 5. Adding a New Model Type

To implement a new model (e.g. a PyTorch Deep Learning Classifier):
1. Create a subclass of `BaseModel` inside `fedsoc/models.py`.
2. Implement:
   - `get_parameters()`: Extract weights as a list of NumPy arrays.
   - `set_parameters(parameters)`: Load weights into the model.
   - `fit(X, y)`: Fit the model for 1 epoch.
   - `evaluate(X, y)`: Evaluate and return metrics dictionary.
   - `predict(X)`: Return predictions array.
3. Update `LocalTrainer` inside `fedsoc/trainer.py` to support the model string.
