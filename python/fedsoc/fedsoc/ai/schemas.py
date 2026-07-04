from pydantic import BaseModel, Field
from typing import List, Dict, Any

class ExplainabilitySchema(BaseModel):
    supporting_evidence: List[str] = Field(description="Key metrics and feature values justifying the classification decision")
    top_contributing_features: List[str] = Field(description="Names of features that contributed most heavily to the prediction")
    feature_importance: Dict[str, float] = Field(description="Dictionary mapping feature names to their respective importance weights")
    prediction_probability: float = Field(description="Float representing the output probability score of the class model")
    evidence_summary: str = Field(description="Textual overview of the physical feature contributions")

class IncidentReportSchema(BaseModel):
    incident_id: str = Field(description="Unique serial ID of the incident e.g. INC-2026-001")
    timestamp: str = Field(description="ISO-8601 UTC timestamp of the detection")
    organization: str = Field(description="Client organization node reporting the event")
    predicted_attack: str = Field(description="Name of the predicted threat class from the federated model")
    confidence: float = Field(description="Classifier confidence score")
    severity: str = Field(description="Calculated threat severity (LOW, MEDIUM, HIGH, CRITICAL)")
    executive_summary: str = Field(description="High-level CISO summary of the threat and mitigation strategy")
    technical_summary: str = Field(description="Detailed engineering synthesis of the logs and threat vector")
    mitre_attack: List[str] = Field(description="Array of MITRE ATT&CK technique IDs e.g. T1498")
    kill_chain_phase: str = Field(description="Unified Cyber Kill Chain phase name")
    affected_assets: List[str] = Field(description="List of impacted assets in the client silo environment")
    recommended_actions: List[str] = Field(description="Detailed actions recommended for SOC engineers")
    containment_steps: List[str] = Field(description="Immediate automated/manual block commands to run")
    confidence_reasoning: str = Field(description="Reasoning detail justifying the model classification")
    limitations: str = Field(description="Data bounds, lack of payload visibility, or model limitations")
    references: List[str] = Field(description="Reference URLs or threat intelligence bulletins")
    explainability: ExplainabilitySchema = Field(description="Explainable machine learning feature metrics")
    
    # Model Governance and Traceability Metadata
    federated_model_version: str = Field(description="Version of the model architecture deployed")
    global_checkpoint_version: str = Field(description="Round checkpoint file name e.g. round_3.pkl")
    dataset_version: str = Field(description="Dataset partition label used in evaluation")
    benchmark_version: str = Field(description="Performance analysis benchmarking run ID")
    prompt_version: str = Field(description="Prompt version identifier used to generate report")
    llm_provider: str = Field(description="LLM provider name e.g. ollama, openai")
    llm_model: str = Field(description="LLM model name e.g. llama3.1, gpt-4o")

class EvaluationRatingSchema(BaseModel):
    correctness: int = Field(ge=1, le=5, description="Factual alignment with the input metrics (1-5)")
    completeness: int = Field(ge=1, le=5, description="Adherence to all requested schema details (1-5)")
    consistency: int = Field(ge=1, le=5, description="Lack of self-contradictions (1-5)")
    safety: int = Field(ge=1, le=5, description="Adherence to security containment and threat limitations (1-5)")
    json_validity: int = Field(ge=1, le=5, description="Parsing success rate and schema alignment (1-5)")
    total_score: float = Field(description="Sum or mean of the 5 criteria")
    explanation: str = Field(description="Detailed reasoning for the given score")
