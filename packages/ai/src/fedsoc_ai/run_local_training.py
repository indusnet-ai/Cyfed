import os
import sys
import json
import time
import argparse
import pandas as pd
import numpy as np
from pathlib import Path
from loguru import logger

# Add source directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from fedsoc_ai.trainer import LocalTrainer

# Resolve workspace root
ROOT = Path(__file__).resolve().parents[4]
DOCS_DIR = ROOT / "docs"
ARTIFACTS_DIR = ROOT / "artifacts"


class BenchmarkReportBuilder:
    """
    Builder pattern class to compile docs/local_training.md benchmark comparison report.
    """
    def __init__(self, metrics_by_client_and_model: dict):
        self.metrics = metrics_by_client_and_model
        self.sections = []

    def add_title(self) -> 'BenchmarkReportBuilder':
        self.sections.append(
            "# Local Intrusion Detection Model Benchmark Report\n\n"
            "This document compares the performance of local machine learning models "
            "trained independently across the simulated organizations (**Bank**, **Hospital**, "
            "**Retail**, and **Telecom**) using the multi-class CICIDS2017 dataset.\n"
        )
        return self

    def add_summary_table(self) -> 'BenchmarkReportBuilder':
        table = "## 1. Overall Performance Comparison Table\n\n"
        table += (
            "| Organization | Model Type | Accuracy | Precision (Macro) | Recall (Macro) | F1-Score (Macro) | ROC-AUC | Training Time |\n"
            "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
        )
        
        for client in ["bank", "hospital", "retail", "telecom"]:
            client_data = self.metrics.get(client, {})
            for model_type in ["sgd", "xgboost"]:
                stats = client_data.get(model_type, {})
                if stats:
                    table += (
                        f"| **{client.upper()}** | `{model_type.upper()}` | {stats['accuracy']:.4f} | "
                        f"{stats['precision']:.4f} | {stats['recall']:.4f} | {stats['f1_score']:.4f} | "
                        f"{stats['roc_auc']:.4f} | {stats['training_time']:.2f}s |\n"
                    )
                else:
                    table += f"| **{client.upper()}** | `{model_type.upper()}` | N/A | N/A | N/A | N/A | N/A | N/A |\n"
        
        self.sections.append(table)
        return self

    def add_confusion_matrices(self) -> 'BenchmarkReportBuilder':
        cm_str = "## 2. Confusion Matrices\n\n"
        for client in ["bank", "hospital", "retail", "telecom"]:
            cm_str += f"### {client.capitalize()} Silo\n\n"
            client_data = self.metrics.get(client, {})
            
            for model_type in ["sgd", "xgboost"]:
                stats = client_data.get(model_type, {})
                if stats and "confusion_matrix" in stats:
                    matrix = np.array(stats["confusion_matrix"])
                    # Standardize presentation (sum of diagonal vs off-diagonal)
                    diag = int(np.trace(matrix))
                    total = int(np.sum(matrix))
                    cm_str += f"**{model_type.upper()} Classifier** (Diagonal/Correct predictions: {diag} / {total} total):\n"
                    cm_str += "```\n"
                    # Print first 5 rows/cols for readability
                    cm_slice = matrix[:5, :5]
                    cm_str += str(cm_slice) + "\n"
                    if len(matrix) > 5:
                        cm_str += f"... plus {len(matrix) - 5} more classes\n"
                    cm_str += "```\n\n"
        
        self.sections.append(cm_str)
        return self

    def add_feature_importance(self) -> 'BenchmarkReportBuilder':
        fi_str = "## 3. XGBoost Feature Importance (Top 10 Features)\n\n"
        fi_str += "Feature importance represents the relative information gain of network flow metrics:\n\n"
        
        for client in ["bank", "hospital", "retail", "telecom"]:
            # Feature importance requires loading the trained model from artifacts
            fi_str += f"### {client.capitalize()} XGBoost Classifier\n"
            model_path = ARTIFACTS_DIR / client / "model.pkl"
            if model_path.exists():
                import pickle
                try:
                    with open(model_path, "rb") as f:
                        wrapper = pickle.load(f)
                    
                    # XGBoost Classifier model booster
                    booster = wrapper.model.get_booster()
                    score = booster.get_score(importance_type='gain')
                    
                    # Sort features by gain importance
                    sorted_features = sorted(score.items(), key=lambda x: x[1], reverse=True)[:10]
                    if sorted_features:
                        fi_str += "| Rank | Feature Column Name | Relative Gain Value |\n| --- | --- | --- |\n"
                        for idx, (feat, val) in enumerate(sorted_features):
                            fi_str += f"| {idx+1} | `{feat}` | {val:.4f} |\n"
                    else:
                        fi_str += "No split features registered (highly uniform class distribution).\n"
                except Exception as e:
                    fi_str += f"Could not load feature importance: {e}\n"
            else:
                fi_str += "Model artifact not found.\n"
            fi_str += "\n"
            
        self.sections.append(fi_str)
        return self

    def build(self) -> str:
        return "\n".join(self.sections)


def main():
    parser = argparse.ArgumentParser(description="FedSOC AI Local Training Runner")
    parser.add_argument(
        "--model", 
        type=str, 
        default="all", 
        choices=["sgd", "xgboost", "all"], 
        help="Select model to train: sgd, xgboost, or all (default: all)"
    )
    args = parser.parse_args()

    clients = ["bank", "hospital", "retail", "telecom"]
    metrics_by_client_and_model = {client: {} for client in clients}

    # Load any pre-existing metrics.json files to preserve comparative history
    for client in clients:
        # Check for SGD metrics
        sgd_metrics_path = ARTIFACTS_DIR / client / "metrics_sgd.json"
        if sgd_metrics_path.exists():
            with open(sgd_metrics_path, "r", encoding="utf-8") as f:
                metrics_by_client_and_model[client]["sgd"] = json.load(f)
        
        # Check for XGBoost metrics (or default model.pkl metrics)
        metrics_path = ARTIFACTS_DIR / client / "metrics.json"
        if metrics_path.exists():
            with open(metrics_path, "r", encoding="utf-8") as f:
                m = json.load(f)
                if m.get("model_type") == "xgboost":
                    metrics_by_client_and_model[client]["xgboost"] = m
                elif m.get("model_type") == "sgd":
                    metrics_by_client_and_model[client]["sgd"] = m

    # Determine what models to train based on configuration
    models_to_train = []
    if args.model == "sgd":
        models_to_train = ["sgd"]
    elif args.model == "xgboost":
        models_to_train = ["xgboost"]
    elif args.model == "all":
        models_to_train = ["sgd", "xgboost"]

    logger.info(f"Starting local training. Configured model: {args.model}")

    for client in clients:
        for model_type in models_to_train:
            logger.info(f"--- Training {model_type.upper()} model for client: {client.upper()} ---")
            trainer = LocalTrainer(client_name=client, model_type=model_type)
            metrics = trainer.train_and_evaluate()
            
            # Save results in our summary dictionary
            metrics_by_client_and_model[client][model_type] = metrics
            
            # If training sgd in 'all' mode, rename artifacts so they are not overwritten by xgboost
            if args.model == "all" and model_type == "sgd":
                sgd_model_path = ARTIFACTS_DIR / client / "model_sgd.pkl"
                sgd_metrics_path = ARTIFACTS_DIR / client / "metrics_sgd.json"
                
                # Move artifacts
                os.replace(ARTIFACTS_DIR / client / "model.pkl", sgd_model_path)
                with open(sgd_metrics_path, "w", encoding="utf-8") as f:
                    json.dump(metrics, f, indent=2)
                logger.info(f"Saved secondary SGD artifacts to model_sgd.pkl and metrics_sgd.json")

    # Compile and generate docs/local_training.md benchmark report
    logger.info("Compiling local training benchmark report...")
    builder = BenchmarkReportBuilder(metrics_by_client_and_model)
    report_content = (
        builder.add_title()
        .add_summary_table()
        .add_confusion_matrices()
        .add_feature_importance()
        .build()
    )

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = DOCS_DIR / "local_training.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    logger.info(f"Local training runner complete. Benchmark report written to: {report_path}")


if __name__ == "__main__":
    main()
