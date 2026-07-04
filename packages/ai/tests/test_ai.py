import pytest
import numpy as np
import pandas as pd
from fedsoc_ai.model import SGDLinearModel, XGBoostModel
from fedsoc_ai.features import FeaturePipeline
from fedsoc_ai.llm import LocalLLM
from fedsoc_ai.prompt_templates import SOCPromptTemplates

def test_sgd_linear_model():
    model = SGDLinearModel(num_features=5)
    
    # Check weights format
    weights = model.get_weights()
    assert len(weights) == 2
    assert weights[0].shape == (1, 5)
    assert weights[1].shape == (1,)

    # Train mock data
    X = np.random.randn(10, 5)
    y = np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    
    metrics = model.fit(X, y)
    assert "loss" in metrics
    assert "accuracy" in metrics
    assert 0.0 <= metrics["accuracy"] <= 1.0

    # Predictions
    preds = model.predict(X)
    assert len(preds) == 10

def test_xgboost_model():
    model = XGBoostModel(n_estimators=5, max_depth=3)
    
    X = np.random.randn(20, 5)
    y = np.array([0, 1] * 10)
    
    metrics = model.fit(X, y)
    assert "accuracy" in metrics
    
    preds = model.predict(X)
    assert len(preds) == 20

def test_feature_pipeline():
    pipeline = FeaturePipeline(expected_features=["feat1", "feat2", "feat3"])
    
    # Mock logs DataFrame
    df = pd.DataFrame({
        "feat1": [1.0, 2.0, np.nan],
        "feat2": [4.0, 5.0, 6.0],
        # feat3 is missing entirely
    })
    
    transformed = pipeline.fit_transform(df)
    assert transformed.shape == (3, 3)
    assert "feat3" in transformed.columns
    assert (transformed["feat3"] == 0.0).all()
    assert not transformed.isnull().any().any()

def test_llm_offline_fallback():
    llm = LocalLLM(provider="ollama", base_url="http://localhost:9999") # fake port to force offline
    response = llm.chat([
        {"role": "system", "content": "You are a helper"},
        {"role": "user", "content": "Analyze security threat alert"}
    ])
    
    assert "Offline Mode" in response["content"]
    assert "Remediation Steps" in response["content"]

def test_prompt_templates():
    prompt = SOCPromptTemplates.threat_analysis_prompt({"duration": 0.1, "count": 22}, 0.85, "bank")
    assert "bank" in prompt
    assert "0.8500" in prompt
