import pytest
import json
from fedsoc.ai.schemas import IncidentReportSchema, EvaluationRatingSchema
from fedsoc.ai.evaluator import AIEvaluator
from fedsoc.ai.service import AISOCAnalystService
from fedsoc.ai.providers import OllamaProvider

def test_pydantic_schema_validation():
    """Tests Pydantic parsing of correct structured incident schema fields."""
    mock_payload = {
        "incident_id": "INC-2026-001",
        "timestamp": "2026-07-03T10:00:00Z",
        "organization": "Nova-Bank-Node",
        "predicted_attack": "DoS",
        "confidence": 0.985,
        "severity": "HIGH",
        "executive_summary": "DoS attack identified.",
        "technical_summary": "Volumetric resource exhaustion details.",
        "mitre_attack": ["T1498"],
        "kill_chain_phase": "Actions on Objectives",
        "affected_assets": ["DMZ Router"],
        "recommended_actions": ["Block origin IP"],
        "containment_steps": ["Null-route traffic"],
        "confidence_reasoning": "Features count above normal baseline.",
        "limitations": "Encrypted payload limits analysis.",
        "references": ["https://attack.mitre.org"],
        "explainability": {
            "supporting_evidence": ["count = 512"],
            "top_contributing_features": ["count"],
            "feature_importance": {"count": 0.9},
            "prediction_probability": 0.985,
            "evidence_summary": "Traffic rate exceeds nominal limit."
        },
        "federated_model_version": "1.0.0",
        "global_checkpoint_version": "round_2.pkl",
        "dataset_version": "CICIDS2017-pruned",
        "benchmark_version": "v1.1",
        "prompt_version": "v1.0",
        "llm_provider": "ollama",
        "llm_model": "llama3.1"
    }

    report = IncidentReportSchema(**mock_payload)
    assert report.incident_id == "INC-2026-001"
    assert report.explainability.prediction_probability == 0.985
    assert "count" in report.explainability.feature_importance

def test_ai_evaluator_heuristics():
    """Tests that AIEvaluator scores mock outputs correctly."""
    inputs = {
        "predicted_attack": "DoS",
        "organization": "Nova-Bank-Node"
    }

    valid_json_response = """
    {
        "incident_id": "INC-2026-001",
        "timestamp": "2026-07-03T10:00:00Z",
        "organization": "Nova-Bank-Node",
        "predicted_attack": "DoS",
        "confidence": 0.98,
        "severity": "HIGH",
        "executive_summary": "Executive summary here",
        "technical_summary": "Technical details here",
        "mitre_attack": ["T1498"],
        "kill_chain_phase": "Actions on Objectives",
        "affected_assets": ["Asset A"],
        "recommended_actions": ["Action A"],
        "containment_steps": ["Step A"],
        "confidence_reasoning": "Reasoning here",
        "limitations": "No limitations",
        "references": [],
        "explainability": {
            "supporting_evidence": ["Metric A"],
            "top_contributing_features": ["Feature A"],
            "feature_importance": {"Feature A": 0.8},
            "prediction_probability": 0.98,
            "evidence_summary": "Evidence here"
        },
        "federated_model_version": "1.0.0",
        "global_checkpoint_version": "round_2.pkl",
        "dataset_version": "CICIDS2017",
        "benchmark_version": "v1.0",
        "prompt_version": "v1.0",
        "llm_provider": "ollama",
        "llm_model": "llama3.1"
    }
    """

    rating = AIEvaluator.evaluate_response(valid_json_response, inputs)
    assert rating.json_validity == 5
    assert rating.correctness == 5
    assert rating.consistency == 5
    assert rating.total_score == 5.0

    # Test invalid JSON response
    invalid_response = "This is not JSON text at all."
    bad_rating = AIEvaluator.evaluate_response(invalid_response, inputs)
    assert bad_rating.json_validity == 1
    assert bad_rating.total_score == 1.0

def test_service_offline_fallback():
    """Tests that AISOCAnalystService triggers the high-fidelity mock fallback if LLM is offline."""
    inputs = {
        "organization": "Boston-Central-Hospital",
        "predicted_attack": "PortScan",
        "confidence": 0.89,
        "top_contributing_features": ["count"],
        "feature_importance": {"count": 0.75},
        "supporting_evidence": ["count = 150"],
        "evidence_summary": "High frequency TCP SYN port scanning signature detected."
    }

    # Initialize service with invalid local Ollama url to force connection exception fallback
    service = AISOCAnalystService(provider_name="ollama", model_name="llama3.1")
    service.provider.base_url = "http://localhost:9999" # invalid port

    report, evals = service.analyze_incident(inputs)
    
    assert report["organization"] == "Boston-Central-Hospital"
    assert report["predicted_attack"] == "PortScan"
    assert report["severity"] == "HIGH"
    assert "T1046" in report["mitre_attack"]
    assert report["explainability"]["prediction_probability"] == 0.89
    assert report["llm_provider"] == "offline-fallback"
    
    # Verify evaluations log is populated
    assert len(evals) == 1
    assert evals[0]["provider"] == "offline-fallback"
    assert evals[0]["scores"]["total_score"] == 5.0
