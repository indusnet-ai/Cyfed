import argparse
from loguru import logger

from fedcore.federation.config import ServerConfig
from fedcore.federation.server import FedCoreServer
from fedsoc.models import SGDClassifierModel, XGBoostClassifierModel

def main():
    parser = argparse.ArgumentParser(description="FedSOC AI Flower Server Coordinator")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface")
    parser.add_argument("--port", type=str, default="8080", help="GRPC port")
    parser.add_argument("--rounds", type=int, default=5, help="Number of FL rounds")
    parser.add_argument("--min-clients", type=int, default=2, help="Minimum clients for training")
    parser.add_argument("--dashboard-api", type=str, default="http://localhost:3000", help="Next.js app URL")
    parser.add_argument("--strategy", type=str, default="fedavg", choices=["fedavg", "fedprox"], help="Aggregation strategy")
    parser.add_argument("--model-type", type=str, default="sgd", choices=["sgd", "xgboost"], help="Underlying ML model class")
    
    args = parser.parse_args()
    
    logger.info(f"Bootstrapping Flower Server Coordinator using FedCore Engine (Model: {args.model_type.upper()})")
    
    # 1. Initialize Server Configuration
    config = ServerConfig(
        host=args.host,
        port=args.port,
        rounds=args.rounds,
        min_clients=args.min_clients,
        strategy=args.strategy,
        dashboard_api=args.dashboard_api
    )
    
    # 2. Instantiate Initial Model
    if args.model_type == "sgd":
        # Assumes 77 standard numeric features for network flows classification
        initial_model = SGDClassifierModel(num_features=77, num_classes=15)
    elif args.model_type == "xgboost":
        initial_model = XGBoostClassifierModel(num_classes=15)
    else:
        raise ValueError(f"Unsupported model type: {args.model_type}")
        
    # 3. Start FedCore Server coordinator
    server = FedCoreServer(config=config, initial_model=initial_model)
    server.start()

if __name__ == "__main__":
    main()
