# Sequence Diagrams

This document contains sequence diagrams explaining core system events inside the CyberFed AI platform.

---

## 1. Client Node Registration & Heartbeat Loop

This flow describes how remote clients announce their state to the central Next.js dashboard API:

```mermaid
sequenceDiagram
    autonumber
    participant Node as Local Node Client
    participant API as Next.js Dashboard API
    participant DB as Supabase PostgreSQL

    Node->>API: POST /api/federation/nodes?id=bank (id, name, datasetSize, status="online")
    API->>DB: INSERT INTO nodes (id, name, status, datasetSize) ON CONFLICT UPDATE
    DB-->>API: Success
    API-->>Node: 200 OK

    Note over Node: Node begins training round...
    Node->>API: POST /api/federation/nodes?id=bank (status="training")
    API->>DB: UPDATE nodes SET status="training" WHERE id='bank'
    DB-->>API: Success
    API-->>Node: 200 OK
```

---

## 2. Federated Training Round

This flow describes a single round of federated weights broadcast, local fitting, parameter aggregation, and checkpointing:

```mermaid
sequenceDiagram
    autonumber
    participant Server as FedCoreServer (Coordinator)
    participant Client as FedCoreClient (NumPyClient)
    participant Auditor as SecurityAuditor
    participant Model as BaseModel (SGD Model)
    participant Dashboard as Next.js Dashboard API

    Note over Server: ROUND 1 INITIATED
    Server->>Client: Broadcast Global parameters (Weights W_g)
    
    Note over Client: Receives weights
    Client->>Model: set_parameters(W_g)
    Client->>Model: fit(X_train, y_train)
    Model-->>Client: Local weights (W_l) + Fit Metrics
    
    Client->>Auditor: audit_outgoing_parameters(W_l)
    Auditor-->>Client: PASS (Compliance Verified)
    
    Client->>Server: Upload local parameters (W_l) + local metrics
    
    Note over Server: Gathers updates from 4 clients
    Server->>Server: Aggregate weights (FedAvg weighted math)
    Server->>Server: Save Checkpoint (round_1.pkl)
    
    Server->>Dashboard: POST /api/federation/rounds (Round 1 aggregates)
```
