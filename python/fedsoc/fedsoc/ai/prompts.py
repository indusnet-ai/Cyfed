import json
from typing import Dict, Any

class SOCPromptTemplates:
    VERSION = "v1.0"

    SYSTEM_INSTRUCTION = """
You are an expert AI Security Operations Center (SOC) Analyst running inside the FedSOC platform.
Your task is to analyze machine learning threat detections and output a detailed, structured security incident intelligence report.

You MUST always return valid JSON that conforms exactly to the following JSON schema:
{schema_definition}

Rules:
1. Ensure all fields in the schema are populated. Do not use placeholders.
2. The severity field MUST be one of: LOW, MEDIUM, HIGH, CRITICAL.
3. The mitre_attack field must list relevant MITRE ATT&CK technique IDs (e.g., T1498).
4. The explainability section must directly refer to and incorporate the numerical values and features provided in the input (such as contributing features and prediction probability).
5. Do NOT include markdown code blocks or triple backticks in your response. Return ONLY raw JSON starting with '{{' and ending with '}}'.
"""

    USER_TEMPLATE = """
A cybersecurity threat was detected by the local federated machine learning classifier. Below are the execution parameters and feature explainability metrics:

### Execution Context:
- Client Organization Node: {organization}
- Predicted Attack Label: {predicted_attack}
- Classification Confidence: {confidence}
- Federated Model Version: {federated_model_version}
- Global Checkpoint File: {global_checkpoint_version}
- Dataset Partition: {dataset_version}
- Technical Benchmark Version: {benchmark_version}

### Explainability Metrics:
- Prediction Probability: {prediction_probability}
- Top Contributing Features: {top_contributing_features}
- Feature Importance Values: {feature_importance}
- Supporting Evidence Metrics: {supporting_evidence}
- Evidence Summary: {evidence_summary}

Synthesize this data into a structured incident report. Provide actionable containment steps and specific MITRE ATT&CK mappings.
"""

    @classmethod
    def get_system_prompt(cls, schema_dict: Dict[str, Any]) -> str:
        return cls.SYSTEM_INSTRUCTION.format(schema_definition=json.dumps(schema_dict, indent=2))

    @classmethod
    def get_user_prompt(cls, inputs: Dict[str, Any]) -> str:
        return cls.USER_TEMPLATE.format(
            organization=inputs.get("organization", "Unknown Node"),
            predicted_attack=inputs.get("predicted_attack", "BENIGN"),
            confidence=inputs.get("confidence", 0.0),
            federated_model_version=inputs.get("federated_model_version", "1.0.0"),
            global_checkpoint_version=inputs.get("global_checkpoint_version", "None"),
            dataset_version=inputs.get("dataset_version", "CICIDS2017"),
            benchmark_version=inputs.get("benchmark_version", "v1.0"),
            prediction_probability=inputs.get("prediction_probability", 0.0),
            top_contributing_features=json.dumps(inputs.get("top_contributing_features", [])),
            feature_importance=json.dumps(inputs.get("feature_importance", {})),
            supporting_evidence=json.dumps(inputs.get("supporting_evidence", [])),
            evidence_summary=inputs.get("evidence_summary", "")
        )
