import os
import pickle
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from loguru import logger

class CheckpointManager:
    def __init__(self, checkpoint_dir: str):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        
    def save_checkpoint(
        self, 
        round_num: int, 
        parameters: List[np.ndarray], 
        metrics: Dict[str, Any],
        version: str = "1.0.0"
    ) -> Path:
        checkpoint_path = self.checkpoint_dir / f"round_{round_num}.pkl"
        logger.info(f"Saving global model checkpoint for round {round_num} to {checkpoint_path}")
        
        checkpoint_data = {
            "version": version,
            "timestamp": np.datetime64('now').astype(str),
            "round": round_num,
            "parameters": parameters,
            "metrics": metrics
        }
        
        with open(checkpoint_path, "wb") as f:
            pickle.dump(checkpoint_data, f)
            
        primary_path = self.checkpoint_dir / "model.pkl"
        with open(primary_path, "wb") as f:
            pickle.dump(checkpoint_data, f)
            
        self.append_metrics_to_history(round_num, metrics, checkpoint_path)
        return checkpoint_path

    def load_checkpoint(self, round_num: int) -> Tuple[List[np.ndarray], Dict[str, Any]]:
        checkpoint_path = self.checkpoint_dir / f"round_{round_num}.pkl"
        if not checkpoint_path.exists():
            raise FileNotFoundError(f"Checkpoint round {round_num} not found at {checkpoint_path}")
            
        logger.info(f"Loading global model checkpoint from {checkpoint_path}")
        with open(checkpoint_path, "rb") as f:
            data = pickle.load(f)
            
        return data["parameters"], data["metrics"]

    def append_metrics_to_history(self, round_num: int, metrics: Dict[str, Any], checkpoint_path: Path):
        metrics_json_path = self.checkpoint_dir / "metrics.json"
        
        history = {}
        if metrics_json_path.exists():
            try:
                with open(metrics_json_path, "r", encoding="utf-8") as f:
                    history = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load metrics history file: {e}")
                
        history[str(round_num)] = {
            "round": round_num,
            "timestamp": np.datetime64('now').astype(str),
            "checkpoint_path": str(checkpoint_path.resolve()),
            "metrics": metrics
        }
        
        try:
            with open(metrics_json_path, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
            logger.info(f"Updated global metrics history file: {metrics_json_path}")
        except Exception as e:
            logger.error(f"Failed to write metrics history file: {e}")
