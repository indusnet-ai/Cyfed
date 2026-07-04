import os
import json
import numpy as np
import pytest
from pathlib import Path
from fedsoc.run_benchmark import FederatedBenchmarker

def test_scalability_projections():
    benchmarker = FederatedBenchmarker()
    projections = benchmarker.simulate_scalability()
    
    assert len(projections) == 5
    assert [p["clients_count"] for p in projections] == [4, 10, 25, 50, 100]
    
    for p in projections:
        assert p["estimated_round_duration_sec"] > 0
        assert p["estimated_bandwidth_kb"] > 0
        assert p["storage_overhead_mb"] > 0
        assert p["aggregation_overhead_sec"] > 0

def test_privacy_audit_logic():
    benchmarker = FederatedBenchmarker()
    audit = benchmarker.run_privacy_audit()
    
    assert audit["raw_logs_audit_passed"] is True
    assert audit["packet_captures_audit_passed"] is True
    assert audit["feature_vectors_audit_passed"] is True
    assert audit["model_parameters_only_exchanged"] is True
    assert audit["bandwidth_reduction_percentage"] > 99.0

def test_communication_stats_generation():
    benchmarker = FederatedBenchmarker()
    mock_history = [
        {"round": 1, "accuracy": 0.95, "loss": 0.2, "precision": 0.6, "recall": 0.5, "macro_f1": 0.5, "weighted_f1": 0.95},
        {"round": 2, "accuracy": 0.96, "loss": 0.15, "precision": 0.65, "recall": 0.55, "macro_f1": 0.55, "weighted_f1": 0.96}
    ]
    
    stats = benchmarker.generate_communication_stats(mock_history)
    assert len(stats) == 2
    assert stats[0]["round"] == 1
    assert stats[1]["round"] == 2
    assert stats[0]["model_size_kb"] == 9.36
    assert stats[0]["total_bandwidth_kb"] == 4 * 2 * 9.36
