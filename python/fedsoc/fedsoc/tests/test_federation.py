import os
import tempfile
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from fedcore.federation.base_model import BaseModel
from fedcore.federation.checkpoint import CheckpointManager
from fedcore.federation.aggregation import aggregate_parameters
from fedsoc.models import SGDClassifierModel, XGBoostClassifierModel
from fedsoc.security import SecurityAuditor
from fedsoc.dataset import get_statistics

def test_sgd_classifier_adapter():
    num_features = 10
    model = SGDClassifierModel(num_features=num_features, num_classes=3)
    
    assert isinstance(model, BaseModel)
    
    params = model.get_parameters()
    assert len(params) == 2
    assert params[0].shape == (3, num_features)
    assert params[1].shape == (3,)
    
    new_coef = np.ones((3, num_features)) * 0.5
    new_intercept = np.ones((3,)) * 0.2
    
    model.set_parameters([new_coef, new_intercept])
    updated_params = model.get_parameters()
    
    assert np.allclose(updated_params[0], new_coef)
    assert np.allclose(updated_params[1], new_intercept)

def test_xgboost_classifier_adapter():
    model = XGBoostClassifierModel(num_classes=2)
    assert isinstance(model, BaseModel)
    
    X = np.random.randn(20, 5)
    y = np.array([0, 1] * 10)
    
    metrics = model.fit(X, y)
    assert "accuracy" in metrics
    assert model.is_trained
    
    params = model.get_parameters()
    assert len(params) == 2
    assert isinstance(params[0], np.ndarray)
    assert len(params[0]) > 0
    
    clone_model = XGBoostClassifierModel(num_classes=2)
    clone_model.set_parameters(params)
    assert clone_model.is_trained
    assert np.all(clone_model.predict(X) == model.predict(X))

def test_fedavg_aggregation():
    params_client_1 = [np.array([1.0, 2.0, 3.0])]
    params_client_2 = [np.array([2.0, 4.0, 6.0])]
    
    results = [
        (params_client_1, 10),
        (params_client_2, 30)
    ]
    
    aggregated = aggregate_parameters(results)
    expected = np.array([1.75, 3.5, 5.25])
    
    assert len(aggregated) == 1
    assert np.allclose(aggregated[0], expected)

def test_checkpoint_management():
    with tempfile.TemporaryDirectory() as temp_dir:
        manager = CheckpointManager(temp_dir)
        
        round_num = 1
        params = [np.array([0.1, 0.2]), np.array([0.5])]
        metrics = {"accuracy": 0.95, "loss": 0.05}
        
        checkpoint_path = manager.save_checkpoint(round_num, params, metrics)
        assert checkpoint_path.exists()
        assert (Path(temp_dir) / "model.pkl").exists()
        assert (Path(temp_dir) / "metrics.json").exists()
        
        loaded_params, loaded_metrics = manager.load_checkpoint(round_num)
        assert len(loaded_params) == 2
        assert np.allclose(loaded_params[0], params[0])
        assert np.allclose(loaded_params[1], params[1])
        assert loaded_metrics["accuracy"] == 0.95

def test_security_auditor():
    valid_params = [np.array([1.0, 2.0]), np.array([0.5])]
    assert SecurityAuditor.audit_outgoing_parameters(valid_params)
    
    # invalid parameters type
    invalid_params = [np.array(["sensitive_data", "leak"])]
    assert not SecurityAuditor.audit_outgoing_parameters(invalid_params)
    
    valid_metrics = {"accuracy": 0.99, "loss": 0.01}
    assert SecurityAuditor.audit_outgoing_metrics(valid_metrics)
    
    invalid_metrics = {"accuracy": 0.99, "client_ip_address": "192.168.1.5"}
    assert not SecurityAuditor.audit_outgoing_metrics(invalid_metrics)
