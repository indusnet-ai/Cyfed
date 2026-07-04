# UML & System Diagrams Reference

This document serves as the master UML architectural reference for the CyberFed AI platform. It contains comprehensive visual diagrams detailing the class structure, physical topology, component modularity, round execution lifecycle, and sequence transactions.

---

## 1. Class Diagram
Illustrates the object-oriented structure of the platform, the decoupling abstractions, and inheritance hierarchies.

```mermaid
classDiagram
    class BaseModel {
        <<interface>>
        +get_parameters() List~ndarray~
        +set_parameters(parameters: List~ndarray~) void
        +fit(X, y) Dict~str, float~
        +evaluate(X, y) Dict~str, float~
        +predict(X) ndarray
    }

    class SGDClassifierModel {
        +model: SGDClassifier
        +num_features: int
        +num_classes: int
        +get_parameters() List~ndarray~
        +set_parameters(parameters: List~ndarray~) void
        +fit(X, y) Dict~str, float~
        +evaluate(X, y) Dict~str, float~
    }

    class XGBoostClassifierModel {
        +model: XGBClassifier
        +num_classes: int
        +classes_map: List~int~
        +get_parameters() List~ndarray~
        +set_parameters(parameters: List~ndarray~) void
        +fit(X, y) Dict~str, float~
        +evaluate(X, y) Dict~str, float~
    }

    class FedCoreServer {
        -config: ServerConfig
        -model: BaseModel
        +start() void
    }

    class FedCoreClient {
        -config: ClientConfig
        -model: BaseModel
        -load_data_fn: Callable
        +start() void
    }

    class FedCoreStrategy {
        -dashboard_url: str
        +aggregate_fit() Tuple
        +aggregate_evaluate() Tuple
    }

    class CheckpointManager {
        -global_dir: Path
        +save_checkpoint() Path
        +load_checkpoint() Tuple
    }

    class ClientRegistry {
        -dashboard_url: str
        +register_client() bool
        +update_heartbeat() bool
    }

    BaseModel <|-- SGDClassifierModel : Inherits/Adapts
    BaseModel <|-- XGBoostClassifierModel : Inherits/Adapts

    FedCoreServer --> BaseModel : Uses
    FedCoreClient --> BaseModel : Uses
    FedCoreServer --> FedCoreStrategy : Coordinates
    FedCoreServer --> CheckpointManager : Manages
    FedCoreClient --> ClientRegistry : Communicates
```

---

## 2. Component Diagram
Illustrates the modular package structure of the platform, showing dependencies between packages and subsystems.

```mermaid
graph TB
    subgraph apps/dashboard
        NextJS[Next.js App REST API]
        UI[Dashboard Telemetry UI]
    end

    subgraph python/fedsoc [CyberSOC Domain App]
        Models[fedsoc.models]
        Trainer[fedsoc.trainer]
        Loader[fedsoc.dataset]
    end

    subgraph python/fedcore [Federation Core Platform]
        Server[fedcore.server]
        Client[fedcore.client]
        Strategy[fedcore.strategy]
        Checkpoint[fedcore.checkpoint]
        Base[fedcore.base_model]
    end

    subgraph Supabase
        DB[(PostgreSQL DB Tables)]
    end

    NextJS --> DB
    UI --> NextJS
    
    Models -.->|Implements| Base
    Trainer --> Loader
    Trainer --> Models
    
    Server --> Base
    Client --> Base
    Server --> Strategy
    Server --> Checkpoint
    
    Strategy -.->|Telemetry POST| NextJS
    Client -.->|Heartbeat POST| NextJS
```

---

## 3. Deployment Diagram
Illustrates the physical nodes of the system and the networking protocols deployed between them.

```mermaid
graph TD
    subgraph Enterprise Central Cloud
        subgraph Server Coordinator Node
            FS[Flower SuperLink Server Coordinator]
        end
        subgraph Web Host Node
            API[Next.js Dashboard REST API]
        end
        subgraph Cloud Database
            DB[(Supabase DB Instance)]
        end
    end

    subgraph Bank On-Premises Client
        Client1[FedCore Client Runner]
        Model1[Local SGD Model]
        Dataset1[(Local Transactions Data)]
    end

    subgraph Telecom On-Premises Client
        Client2[FedCore Client Runner]
        Model2[Local SGD Model]
        Dataset2[(Local Network Flows Data)]
    end

    FS <-->|gRPC Port 8080 TLS| Client1
    FS <-->|gRPC Port 8080 TLS| Client2
    
    Client1 <--> Model1
    Model1 --- Dataset1
    
    Client2 <--> Model2
    Model2 --- Dataset2
    
    Client1 -->|HTTPS REST Port 443| API
    Client2 -->|HTTPS REST Port 443| API
    FS -->|HTTPS REST Port 443| API
    
    API <-->|SSL TCP Port 5432| DB
```

---

## 4. Sequence Diagram
Illustrates the temporal transaction timeline of a complete federated training round.

```mermaid
sequenceDiagram
    autonumber
    participant Server as FedCoreServer (Coordinator)
    participant ClientRegistry as Dashboard API
    participant Client as FedCoreClient (NumPyClient)
    participant Model as BaseModel (SGD Model)

    Note over Client: Startup node
    Client->>ClientRegistry: POST /api/federation/nodes (Status: Online)
    
    Note over Server: Start Round 1
    Server->>Client: Broadcast Global Weights (W_g)
    
    Client->>ClientRegistry: POST /api/federation/nodes (Status: Training)
    Client->>Model: set_parameters(W_g)
    Client->>Model: fit(X_train, y_train)
    Model-->>Client: Updated parameters (W_l) + Metrics
    
    Client->>ClientRegistry: POST /api/federation/nodes (Status: Online)
    Client->>Server: Send local parameters (W_l) + Metrics
    
    Note over Server: Gather all client updates
    Server->>Server: aggregate_parameters (FedAvg math)
    Server->>Server: save_checkpoint (round_1.pkl)
    
    Server->>ClientRegistry: POST /api/federation/rounds (Round 1 aggregates)
```

---

## 5. Activity Diagram
Illustrates the logical workflow and decision-making logic of the federated optimization cycle.

```mermaid
stateDiagram-v2
    [*] --> InitializeServer
    InitializeServer --> AwaitClients : Start Coordinator on 8080
    
    state AwaitClients {
        [*] --> Listen
        Listen --> ClientConnected : Node Announce
        ClientConnected --> VerifyClient
        VerifyClient --> Listen : Connected Count < MinClients
        VerifyClient --> StartFLRound : Connected Count >= MinClients
    }

    StartFLRound --> BroadcastParameters : Server Sends W_g
    
    state ClientLocalExecution {
        [*] --> LoadWeights
        LoadWeights --> RunLocalFit : 1 Epoch Training
        RunLocalFit --> PrivacyAudit : Verify Parameters
        PrivacyAudit --> UploadParameters : Audit Passed
        PrivacyAudit --> [*] : Audit Failed (Raise Exception)
    }

    BroadcastParameters --> ClientLocalExecution
    UploadParameters --> AggregateServer : Server collects W_l

    state AggregateServer {
        [*] --> FedAvgMath
        FedAvgMath --> SaveCheckpoints : Write PKL on disk
        SaveCheckpoints --> TelemetryUpload : POST to Dashboard API
    }

    AggregateServer --> CheckRoundsLeft
    CheckRoundsLeft --> StartFLRound : Round < MaxRounds
    CheckRoundsLeft --> SaveFinalModel : Round == MaxRounds
    SaveFinalModel --> [*]
```
