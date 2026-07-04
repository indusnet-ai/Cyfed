class SOCPromptTemplates:
    """
    Prompt templates for LLM-assisted SOC reasoning and threat intelligence.
    Specifically designed for Llama 3.1 8B.
    """
    
    @staticmethod
    def get_system_prompt() -> str:
        return (
            "You are an expert Security Operations Center (SOC) AI Analyst. "
            "Your role is to analyze security alerts, identify anomalous patterns, "
            "explain federated model metrics, and provide remediation steps. "
            "Respond in a professional, structured markdown format. "
            "Be precise, technical, and prioritize security best practices."
        )

    @staticmethod
    def threat_analysis_prompt(features: dict, prediction: float, node_type: str) -> str:
        return f"""
Analyze the following security event detected by the Federated AI Platform:

### Event Metadata
- **Source Node Profile**: {node_type}
- **Anomalous Probability**: {prediction:.4f}
- **Status**: {"MALICIOUS ALERT" if prediction >= 0.5 else "BENIGN EVENT"}

### Log Metrics / Features
{chr(10).join([f"- **{k}**: {v}" for k, v in features.items()])}

### Request
1. Explain if this log indicates a known attack pattern (e.g. Reconnaissance, DoS, Brute Force, Exfiltration) based on the log values.
2. Outline immediate triage and containment steps relevant to a {node_type} environment.
3. Recommend what firewall rules or security updates should be deployed.
"""

    @staticmethod
    def federated_round_summary(round_id: int, before_acc: float, after_acc: float, nodes_participating: list[str]) -> str:
        return f"""
Review the outcomes of the latest Federated Learning (FL) training round:

### Round Overview
- **Round ID**: {round_id}
- **Participating Nodes**: {", ".join(nodes_participating)}
- **Global Model Performance**:
  - Previous Accuracy: {before_acc:.4f}
  - New Aggregated Accuracy: {after_acc:.4f}
  - Performance Delta: {after_acc - before_acc:+.4f}

### Request
1. Interpret the performance trend of this training round.
2. If any node contributed anomalous local updates that decreased the overall accuracy, explain how to investigate a potential "data poisoning" or client-side training failure.
3. Formulate a summary message to display on the SOC main dashboard.
"""
