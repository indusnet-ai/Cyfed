import os
import sys
import json
import pandas as pd
from pathlib import Path
from loguru import logger

# Add source directory to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from fedsoc_ai.dataset import load_dataset, preprocess, split_into_clients, get_statistics

# Resolve workspace root folder relative to this file
ROOT = Path(__file__).resolve().parents[4]
DATASET_DIR = ROOT / "Dataset"
CLIENTS_DIR = ROOT / "datasets" / "clients"
DOCS_DIR = ROOT / "docs"


class MarkdownReportBuilder:
    """
    Builder pattern class to generate docs/datasets.md template report.
    """
    def __init__(self, raw_stats: dict, client_stats: dict, label_mapping: dict):
        self.raw_stats = raw_stats
        self.client_stats = client_stats
        self.label_mapping = label_mapping
        self.sections = []

    def add_title(self) -> 'MarkdownReportBuilder':
        self.sections.append(
            "# CICIDS2017 Refined Dataset Report\n\n"
            "This report documents the structural features, label mappings, "
            "independent client statistics, and partitioning strategy for the "
            "refined **CICIDS2017 Parquet dataset**.\n"
        )
        return self

    def add_dataset_summary(self) -> 'MarkdownReportBuilder':
        summary = (
            "## 1. Global Raw Dataset Summary\n\n"
            f"- **Total Raw Rows**: {self.raw_stats['num_rows']:,}\n"
            f"- **Total Columns**: {self.raw_stats['num_columns']}\n"
            f"- **Memory Usage**: {self.raw_stats['memory_usage']:.2f} MB\n"
            f"- **Duplicate Rows**: {self.raw_stats['duplicate_count']:,}\n"
            f"- **Total Missing Values**: {self.raw_stats['missing_values']}\n"
        )
        self.sections.append(summary)
        return self

    def add_label_mapping(self) -> 'MarkdownReportBuilder':
        mapping_str = "## 2. Multi-Class Label Encoder Mapping\n\n"
        mapping_str += "The target strings have been mapped to multiclass integer identifiers:\n\n"
        mapping_str += "| Original Class Name | Encoded Integer Target |\n| --- | --- |\n"
        
        # Sort by mapping index
        sorted_map = sorted(self.label_mapping.items(), key=lambda x: x[1])
        for name, target in sorted_map:
            mapping_str += f"| `{name}` | `{target}` |\n"
        
        self.sections.append(mapping_str)
        return self

    def add_attack_distributions(self) -> 'MarkdownReportBuilder':
        dist = "## 3. Global Threat Class Distributions\n\n"
        dist += "| Threat Class Name | Flow Count | Percentage |\n| --- | --- | --- |\n"
        total = self.raw_stats['num_rows']
        
        # Sort by counts
        sorted_dist = sorted(self.raw_stats['label_distribution'].items(), key=lambda x: x[1], reverse=True)
        for label, count in sorted_dist:
            percentage = (count / total) * 100
            dist += f"| `{label}` | {count:,} | {percentage:.4f}% |\n"
            
        self.sections.append(dist)
        return self

    def add_partition_summary(self) -> 'MarkdownReportBuilder':
        partition = "## 4. Federated Client Silo Partitioning (Non-IID)\n\n"
        partition += (
            "To replicate a realistic federated environment, normal baseline (`Benign`) traffic "
            "is split disjointly among nodes, while threat vectors are dynamically routed by "
            "sorted class indices to simulate independent client security profiles:\n\n"
        )
        partition += "| Client Silo | Friendly Name | Row Count | Target Attack Categories |\n| --- | --- | --- | --- |\n"
        
        keywords_map = {
            "bank": "DoS GoldenEye, DoS slowloris, Heartbleed, SSH-Patator",
            "hospital": "Bot, DDoS, DoS Slowhttptest, Infiltration, Web Attack - Sql Injection",
            "retail": "DoS Hulk, FTP-Patator, PortScan, Web Attack - Brute Force",
            "telecom": "Benign baseline, Web Attack - XSS"
        }
        
        for client, stats in self.client_stats.items():
            classes = list(stats['label_distribution'].keys())
            attacks = [c for c in classes if c.upper() != 'BENIGN']
            attacks_str = ", ".join([f"`{a}`" for a in attacks]) if attacks else "None (Benign Only)"
            
            # Use predefined summary if matches, else show actual list
            desc = keywords_map.get(client, attacks_str)
            partition += f"| **{client.upper()}** | `{client.capitalize()}` | {stats['num_rows']:,} | {desc} |\n"
            
        self.sections.append(partition)
        return self

    def add_client_statistics(self) -> 'MarkdownReportBuilder':
        stats_str = "## 5. Local Preprocessing & Local Scaling Stats\n\n"
        stats_str += (
            "Each client node independently preprocesses its dataset and fits its own `StandardScaler`. "
            "This ensures that mean and variance profiles are never leaked or shared globally. "
            "Below is a comparison of client stats post-scaling:\n\n"
        )
        
        stats_str += "| Client | Total Preprocessed Rows | Cleaned Columns | Missing Values | Memory size | Attack Ratio |\n| --- | --- | --- | --- | --- | --- |\n"
        for client, stats in self.client_stats.items():
            total = stats['num_rows']
            attacks = sum(count for label, count in stats['label_distribution'].items() if label.upper() != 'BENIGN')
            ratio = (attacks / total) * 100 if total > 0 else 0
            stats_str += (
                f"| **{client.upper()}** | {total:,} | {stats['num_columns']} | "
                f"{stats['missing_values']} | {stats['memory_usage']:.2f} MB | {ratio:.2f}% |\n"
            )
            
        self.sections.append(stats_str)
        return self

    def add_feature_statistics(self) -> 'MarkdownReportBuilder':
        feature_str = "## 6. Local Feature Profiles (Sample of Bank Silo)\n\n"
        feature_str += "Below is a sample of local scaling statistics fitted for the **Bank** client partition:\n\n"
        feature_str += "| Feature Column | Mean | Standard Deviation | Min | Max |\n| --- | --- | --- | --- | --- |\n"
        
        bank_stats = self.client_stats.get("bank", {})
        if bank_stats and "feature_summary" in bank_stats:
            for feature, metrics in bank_stats["feature_summary"].items():
                feature_str += (
                    f"| `{feature}` | {metrics['mean']:.4f} | {metrics['std']:.4f} | "
                    f"{metrics['min']:.4f} | {metrics['max']:.4f} |\n"
                )
        else:
            feature_str += "| - | - | - | - | - |\n"
            
        self.sections.append(feature_str)
        return self

    def build(self) -> str:
        return "\n".join(self.sections)


def run_pipeline():
    logger.info("Starting Dataset Pipeline Refinement & Partitioning...")
    
    # 1. Load raw dataset
    logger.info(f"Loading raw dataset from: {DATASET_DIR}")
    raw_df = load_dataset(DATASET_DIR)
    
    # Sanitize raw labels immediately to ensure consistent, clean reporting
    if 'Label' in raw_df.columns:
        raw_df['Label'] = raw_df['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip()
        
    # Get raw statistics
    raw_stats = get_statistics(raw_df)
    logger.info(f"Raw rows: {raw_stats['num_rows']:,}, Raw columns: {raw_stats['num_columns']}")
    
    # 2. Partition dataset first (avoiding global data leakage)
    logger.info("Partitioning dataset into 4 silos (Non-IID strategy)...")
    partitions = split_into_clients(raw_df, strategy="non_iid")
    
    # 3. Preprocess each client dataset independently (fits StandardScaler locally)
    logger.info("Preprocessing each client dataset independently...")
    preprocessed_partitions = {}
    client_stats = {}
    
    # Resolve and clean clients target folder
    CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
    mapping_path = CLIENTS_DIR / "label_mapping.json"
    
    # Generate global label mapping to ensure all clients map threat classes consistently
    logger.info("Generating global label mapping...")
    unique_labels = raw_df['Label'].astype(str).str.replace(r'[^\x00-\x7F]+', '-', regex=True).str.strip().unique()
    sorted_labels = sorted(unique_labels, key=lambda l: (str(l).upper() != 'BENIGN', str(l)))
    label_mapping = {str(label): idx for idx, label in enumerate(sorted_labels)}
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(label_mapping, f, indent=2)
    logger.info(f"Saved Global Label Mapping ({len(label_mapping)} classes) to {mapping_path}")
        
    for client, raw_client_df in partitions.items():
        logger.info(f"Preprocessing {client}...")
        # Fit and transform client preprocessor locally
        proc_df = preprocess(raw_client_df, mapping_path=mapping_path)
        preprocessed_partitions[client] = proc_df
        
        # Save partitioned parquet file
        parquet_path = CLIENTS_DIR / f"{client}.parquet"
        proc_df.to_parquet(parquet_path, engine='pyarrow')
        logger.info(f"Saved local dataset to {parquet_path.name}")
        
        # Get statistics for preprocessed dataset
        client_stats[client] = get_statistics(proc_df)
    
    # 4. Load fitted label mapping
    with open(mapping_path, 'r', encoding='utf-8') as f:
        label_mapping = json.load(f)
        
    # 5. Generate Markdown Report using Report Builder
    logger.info("Compiling Report...")
    builder = MarkdownReportBuilder(raw_stats, client_stats, label_mapping)
    report_content = (
        builder.add_title()
        .add_dataset_summary()
        .add_label_mapping()
        .add_attack_distributions()
        .add_partition_summary()
        .add_client_statistics()
        .add_feature_statistics()
        .build()
    )
    
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = DOCS_DIR / "datasets.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    logger.info(f"Refinement pipeline completed. Report generated at {report_path}")


if __name__ == "__main__":
    run_pipeline()
