# Investor Showcase: Platform Architecture Overview

This document summarizes the high-level decoupled software layers of the FedSOC AI platform.

---

## 1. Decoupled Two-Layer Design

```mermaid
graph TD
    subgraph Layer 1: FedCore Platform (Generic Federation)
        Server[FedCore Server Coordinator]
        Client[FedCore Client Runner]
        Checkpoint[Checkpoint Manager]
        Adapter[Model Adapter Interface]
    end

    subgraph Layer 2: FedSOC Application (Domain Logic)
        Classifier[SGD/XGBoost Classifier]
        Loader[CICIDS2017 Dataset Loader]
        Service[AI SOC Analyst Service]
        Dashboard[Next.js Telemetry Web App]
    end

    Server <-->|gRPC Port 8080 TLS| Client
    Client --> Adapter
    Adapter --> Classifier
    
    Classifier --- Loader
    Service -.->|Trigger Dual Eval| Classifier
    Dashboard <-->|REST /api/federation| Server
```

---

## 2. Infrastructure Layer Specs

- **Communication Protocols**: Local client training weights are serialized into NumPy ndarrays and transmitted over secure gRPC channels.
- **Database Telemetry Sync**: Real-time heartbeats and aggregates are posted to a PostgreSQL (Supabase) database via Next.js REST API routes.
- **Explainability Logging**: Local feature importance vectors are computed and stored alongside global checkpoint models to allow complete audit traceability.
