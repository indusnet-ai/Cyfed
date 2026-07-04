import pytest
import os
import tempfile
import pickle
import json
from pathlib import Path
import pandas as pd
import numpy as np
from fedsoc_ai.model import SGDClassifierModel, XGBoostClassifierModel, BaseModel
from fedsoc_ai.trainer import LocalTrainer

@pytest.fixture
def mock_dataset_and_paths():
    """Sets up a temp folder with a mock client parquet and overrides directories."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # 1. Create a dummy preprocessed client parquet file
        # We need 77 numeric features to match SGDClassifierModel default num_features
        features = {f"feature_{i}": np.random.randn(100) for i in range(77)}
        features["target"] = np.array(list(range(15)) * 6 + list(np.random.randint(0, 15, size=10)))
        features["_original_label"] = [f"Class_{t}" for t in features["target"]]
        
        df = pd.DataFrame(features)
        
        clients_dir = temp_path / "datasets" / "clients"
        clients_dir.mkdir(parents=True, exist_ok=True)
        
        client_file = clients_dir / "test_client.parquet"
        df.to_parquet(client_file, engine='pyarrow')
        
        # Override module directories
        import fedsoc_ai.trainer
        old_clients_dir = fedsoc_ai.trainer.DEFAULT_CLIENTS_DIR
        old_artifacts_dir = fedsoc_ai.trainer.DEFAULT_ARTIFACTS_DIR
        
        fedsoc_ai.trainer.DEFAULT_CLIENTS_DIR = clients_dir
        fedsoc_ai.trainer.DEFAULT_ARTIFACTS_DIR = temp_path / "artifacts"
        
        yield temp_path
        
        # Restore module directories
        fedsoc_ai.trainer.DEFAULT_CLIENTS_DIR = old_clients_dir
        fedsoc_ai.trainer.DEFAULT_ARTIFACTS_DIR = old_artifacts_dir


def test_base_model_compliance():
    # Verify that SGDClassifierModel and XGBoostClassifierModel comply with BaseModel interface
    sgd = SGDClassifierModel(num_features=10, num_classes=3)
    xgb_model = XGBoostClassifierModel(num_classes=3)
    
    assert isinstance(sgd, BaseModel)
    assert isinstance(xgb_model, BaseModel)
    
    # Check abstract methods existence
    assert hasattr(sgd, "fit")
    assert hasattr(sgd, "predict")
    assert hasattr(sgd, "predict_proba")
    assert hasattr(sgd, "get_weights")
    assert hasattr(sgd, "set_weights")
    assert hasattr(sgd, "evaluate")


def test_trainer_pipeline_fit_and_evaluate(mock_dataset_and_paths):
    # Test trainer run using SGD Classifier Model
    trainer = LocalTrainer(client_name="test_client", model_type="sgd", num_classes=15)
    
    # Train and evaluate
    metrics = trainer.train_and_evaluate()
    
    # Assertions on metrics
    assert metrics["client_name"] == "test_client"
    assert metrics["model_type"] == "sgd"
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1_score" in metrics
    assert "roc_auc" in metrics
    assert "confusion_matrix" in metrics
    assert "training_time" in metrics
    assert "prediction_time" in metrics
    assert metrics["dataset_version"] == "1.0.0"
    assert metrics["model_version"] == "1.0.0"
    assert "timestamp" in metrics

    # Assert confusion matrix shape (15x15)
    cm = np.array(metrics["confusion_matrix"])
    assert cm.shape == (15, 15)


def test_trainer_artifact_saving_and_reloading(mock_dataset_and_paths):
    trainer = LocalTrainer(client_name="test_client", model_type="xgboost", num_classes=15)
    
    # Split data to get sample test inputs
    X_train, X_test, y_train, y_test = trainer.load_and_split()
    
    # Train and save artifacts
    metrics_original = trainer.train_and_evaluate()
    
    # Verify artifact folders and files are created
    artifact_dir = mock_dataset_and_paths / "artifacts" / "test_client"
    assert (artifact_dir / "model.pkl").exists()
    assert (artifact_dir / "scaler.pkl").exists()
    assert (artifact_dir / "metrics.json").exists()

    # Load artifacts and verify
    reloaded_model, reloaded_metrics = trainer.load_artifacts()
    assert reloaded_metrics["client_name"] == "test_client"
    assert reloaded_metrics["model_type"] == "xgboost"
    
    # Predict with reloaded model and verify reproducibility
    preds_original = trainer.model.predict(X_test)
    preds_reloaded = reloaded_model.predict(X_test)
    
    assert np.array_equal(preds_original, preds_reloaded), "Model predictions are not identical after pickle reload!"


def test_trainer_invalid_config():
    with pytest.raises(ValueError):
        LocalTrainer(client_name="test_client", model_type="unknown_model")
