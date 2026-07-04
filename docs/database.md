# Database Schema & Models

This document details the database schema configuration for the CyberFed AI platform. The tables reside in Supabase (PostgreSQL) and track real-time training rounds and node registries.

---

## 1. Supabase Schema Tables

The schema is defined in [supabase_schema.sql](file:///e:/CyberFed%20AI/docs/supabase_schema.sql):

### 1.1 `nodes` Table
Tracks connected organizational clients and their status heartbeats.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT` (PK) | Client unique ID (e.g. `bank`, `hospital`) |
| `name` | `TEXT` | Human-readable node name |
| `type` | `TEXT` | Node type (`organization` / `client`) |
| `status` | `TEXT` | Current status (`online`, `offline`, `training`) |
| `ipAddress` | `TEXT` | Local node IP address |
| `datasetSize` | `INTEGER` | Total network flow rows in local partition |
| `lastActive` | `TIMESTAMP` | Last heartbeat update timestamp |

### 1.2 `training_rounds` Table
Tracks aggregated model performance scores at the end of each Flower round.

| Column | Type | Description |
| :--- | :--- | :--- |
| `round` | `INTEGER` (PK) | Flower round number |
| `accuracy` | `DOUBLE` | Aggregated model accuracy |
| `loss` | `DOUBLE` | Aggregated log loss |
| `precision` | `DOUBLE` | Macro precision score |
| `recall` | `DOUBLE` | Macro recall score |
| `f1` | `DOUBLE` | Macro F1-score |
| `participatingNodes`| `TEXT[]` | IDs of clients sampled in the round |
| `duration` | `DOUBLE` | Round elapsed time (seconds) |
| `aggregationTime` | `DOUBLE` | Server FedAvg averaging time |
| `timestamp` | `TIMESTAMP` | Record timestamp |

### 1.3 `global_models` Table
Tracks persisted global checkpoint locations.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Checkpoint unique identifier |
| `version` | `TEXT` | Model semantic version (e.g. `1.0.0`) |
| `checkpointPath` | `TEXT` | Local disk or object storage path |
| `roundNumber` | `INTEGER` | Source federated round number |
| `accuracy` | `DOUBLE` | Global aggregated accuracy |
| `loss` | `DOUBLE` | Global aggregated loss |

---

## 2. Integrity & Purging Rules

1.  **Duplicate Identifiers**:
    - `nodes.id` uses a strict `PRIMARY KEY` constraint to prevent redundant nodes registering.
2.  **Heartbeat Purging**:
    - A cron job or dashboard backend query tags nodes as `offline` if `lastActive` is older than 60 seconds.
