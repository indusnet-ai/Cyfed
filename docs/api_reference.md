# Next.js REST API Reference

The dashboard provides REST API endpoints to capture client node telemetry, monitor rounds, register checkpoints, and fetch benchmark metrics. All routes are located under `apps/dashboard/src/app/api/`.

---

## 1. Federation Management APIs

### 1.1 GET/POST `/api/federation/nodes`
- **GET**: Returns details of all registered organization client nodes.
- **POST**: Registers or updates client heartbeat metadata.
  - **Payload**:
    ```json
    {
      "id": "bank",
      "name": "BANK",
      "type": "organization",
      "status": "training",
      "ipAddress": "127.0.0.1",
      "datasetSize": 394936
    }
    ```
  - **Response (200)**: Successful registration.

### 1.2 GET/POST `/api/federation/rounds`
- **GET**: Returns list of all aggregated federated training rounds.
- **POST**: Saves round aggregated metrics at round completion.
  - **Payload**:
    ```json
    {
      "round": 1,
      "accuracy": 0.9861,
      "loss": 0.1309,
      "precision": 0.6592,
      "recall": 0.5460,
      "f1": 0.5604,
      "participatingNodes": ["bank", "hospital", "retail", "telecom"],
      "duration": 79.25,
      "aggregationTime": 0.044
    }
    ```

### 1.3 GET/POST `/api/federation/global-model`
- **GET**: Retrieves the latest global model version metadata.
- **POST**: Registers a new global model checkpoint.

### 1.4 GET `/api/federation/checkpoints`
- **GET**: Lists local `.pkl` checkpoint files written on disk in the artifacts directory.

---

## 2. Benchmark APIs

### 2.1 GET `/api/benchmark/summary`
- Returns local vs global comparative accuracy values for all clients.

### 2.2 GET `/api/benchmark/convergence`
- Returns global accuracy, loss, and F1 progress over rounds alongside client weight drifts.

### 2.3 GET `/api/benchmark/communication`
- Returns bandwidth (KB) and duration profiles per round.

### 2.4 GET `/api/benchmark/privacy`
- Returns status of verification logs check.

### 2.5 GET `/api/benchmark/scalability`
- Returns mathematical scaling projections from 4 to 100 client nodes.

### 2.6 GET `/api/benchmark/business`
- Returns centralized vs federated comparisons, regulatory mappings, and cost projections.
