import pytest
import os
import tempfile
from pathlib import Path
import pandas as pd
import numpy as np
from fedsoc_ai.dataset import (
    CICIDS2017Loader,
    CICIDS2017Preprocessor,
    ClientPartitioner,
    load_dataset,
    preprocess,
    split_into_clients,
    get_statistics
)

@pytest.fixture
def mock_dataset_dir():
    """Creates a temp directory with two schema-consistent parquet files and one inconsistent file."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create normal schemas
        df1 = pd.DataFrame({
            "Destination Port": [80, 443, 8080],
            "Flow Duration": [1000.0, 2000.0, 500.0],
            "Flow Bytes/s": [100.5, np.inf, 200.0], # Include infinity
            "Total Fwd Packets": [2, 5, 1],
            "Label": ["BENIGN", "DDoS", "BENIGN"]
        })
        
        df2 = pd.DataFrame({
            "Destination Port": [22, 443],
            "Flow Duration": [150.0, 10000.0],
            "Flow Bytes/s": [50.0, 1200.0],
            "Total Fwd Packets": [10, 2],
            "Label": ["PortScan", "BENIGN"]
        })
        
        # Mismatched schema (missing 'Flow Duration', extra 'Protocol')
        df_bad = pd.DataFrame({
            "Destination Port": [80],
            "Flow Bytes/s": [10.0],
            "Total Fwd Packets": [1],
            "Protocol": [6],
            "Label": ["BENIGN"]
        })

        df1.to_parquet(os.path.join(temp_dir, "file1.parquet"), engine='pyarrow')
        df2.to_parquet(os.path.join(temp_dir, "file2.parquet"), engine='pyarrow')
        df_bad.to_parquet(os.path.join(temp_dir, "bad_file.parquet"), engine='pyarrow')
        
        yield temp_dir


def test_loader_discovery_and_schema_validation(mock_dataset_dir):
    loader = CICIDS2017Loader(mock_dataset_dir)
    assert len(loader.files) == 3 # file1, file2, bad_file
    
    # Check that schema validation flags the mismatch
    success, mismatches = loader.validate_schemas()
    assert success is False
    assert len(mismatches) > 0
    assert any("bad_file" in m for m in mismatches)


def test_loader_concatenation(mock_dataset_dir):
    # Load only the first two (valid) files by filtering bad_file
    valid_files = [f for f in glob_files(mock_dataset_dir) if "bad_file" not in f.name]
    
    dfs = [pd.read_parquet(f) for f in valid_files]
    combined = pd.concat(dfs, ignore_index=True)
    
    assert len(combined) == 5
    assert set(combined["Label"]) == {"BENIGN", "DDoS", "PortScan"}


def glob_files(directory):
    path = Path(directory)
    return list(path.glob("*.parquet"))


def test_preprocessor_pipeline(mock_dataset_dir):
    # Load valid data
    files = [f for f in glob_files(mock_dataset_dir) if "bad_file" not in f.name]
    df = pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)
    df.columns = df.columns.str.strip()

    mapping_path = Path(mock_dataset_dir) / "label_mapping.json"
    preprocessor = CICIDS2017Preprocessor(mapping_path=mapping_path)
    processed = preprocessor.fit_transform(df)

    # 1. Target column created
    assert 'target' in processed.columns
    # 2. Original Label dropped, but original text label saved as metadata
    assert 'Label' not in processed.columns
    assert '_original_label' in processed.columns
    # 3. Multiclass encoding mappings (BENIGN -> 0, others -> 1..14)
    assert (processed.loc[processed['_original_label'] == 'BENIGN', 'target'] == 0).all()
    
    ddos_val = processed.loc[processed['_original_label'] == 'DDoS', 'target'].iloc[0]
    portscan_val = processed.loc[processed['_original_label'] == 'PortScan', 'target'].iloc[0]
    
    assert ddos_val > 0
    assert portscan_val > 0
    assert ddos_val != portscan_val
    
    # 4. Infinity handling (Flow Bytes/s had np.inf in file1)
    assert not np.isinf(processed['Flow Bytes/s']).any()
    assert not processed['Flow Bytes/s'].isnull().any()


def test_client_partitioning_leakage():
    # Construct a larger dataframe representing multiple classes
    df = pd.DataFrame({
        "feature1": np.random.randn(100),
        "feature2": np.random.randn(100),
        "Label": ["BENIGN"] * 60 + ["DDoS"] * 20 + ["PortScan"] * 10 + ["Bot"] * 10
    })
    
    # Run IID Partition
    iid_splits = ClientPartitioner.partition_iid(df)
    assert len(iid_splits) == 4
    
    # Check that IID splits are disjoint (no indices overlap)
    iid_vals = [set(split["feature1"]) for split in iid_splits.values()]
    for i in range(4):
        for j in range(i + 1, 4):
            assert len(iid_vals[i].intersection(iid_vals[j])) == 0

    # Run Non-IID Partition
    non_iid_splits = ClientPartitioner.partition_non_iid(df)
    assert len(non_iid_splits) == 4
    
    # Verify non-IID class routing logic:
    # unique attacks sorted: ['Bot', 'DDoS', 'PortScan']
    # index 0 -> Bot -> bank
    # index 1 -> DDoS -> hospital
    # index 2 -> PortScan -> retail
    # index 3 -> empty -> telecom (only benign)
    assert (non_iid_splits["bank"]["Label"].isin(["BENIGN", "Bot"])).all()
    assert (non_iid_splits["hospital"]["Label"].isin(["BENIGN", "DDoS"])).all()
    assert (non_iid_splits["retail"]["Label"].isin(["BENIGN", "PortScan"])).all()
    assert (non_iid_splits["telecom"]["Label"] == "BENIGN").all()
    
    # Verify no value overlap (disjoint row leakage) across client partitions
    non_iid_vals = [set(split["feature1"]) for split in non_iid_splits.values()]
    for i in range(4):
        for j in range(i + 1, 4):
            intersect = non_iid_vals[i].intersection(non_iid_vals[j])
            assert len(intersect) == 0, f"Overlap detected between clients: {intersect}"


def test_statistics_helper():
    df = pd.DataFrame({
        "col1": [1.0, 2.0, np.nan],
        "_original_label": ["BENIGN", "Bot", "BENIGN"],
        "target": [0, 1, 0]
    })
    stats = get_statistics(df)
    assert stats["num_rows"] == 3
    assert stats["num_columns"] == 3
    assert stats["missing_values"] == 1
    assert stats["duplicate_count"] == 0
    assert stats["label_distribution"] == {"BENIGN": 2, "Bot": 1}
    assert stats["target_distribution"] == {0: 2, 1: 1}
    assert "memory_usage" in stats
    assert "feature_summary" in stats
