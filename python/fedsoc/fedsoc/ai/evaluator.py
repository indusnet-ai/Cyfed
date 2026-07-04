import json
from typing import Dict, Any, Tuple
from loguru import logger
from .schemas import EvaluationRatingSchema

class AIEvaluator:
    @staticmethod
    def evaluate_response(content: str, inputs: Dict[str, Any]) -> EvaluationRatingSchema:
        """
        Deterministically evaluates a generated response against schema and correctness parameters.
        Returns an EvaluationRatingSchema with details.
        """
        correctness = 5
        completeness = 5
        consistency = 5
        safety = 5
        json_validity = 5
        explanation_parts = []

        # 1. JSON Validity check
        parsed_data = None
        try:
            # Strip any markdown backticks if the LLM returned them
            clean_content = content.strip()
            if clean_content.startswith("```json"):
                clean_content = clean_content.replace("```json", "", 1)
            if clean_content.endswith("```"):
                clean_content = clean_content[:-3]
            clean_content = clean_content.strip()

            parsed_data = json.loads(clean_content)
            explanation_parts.append("JSON parses successfully.")
        except Exception as e:
            json_validity = 1
            correctness = 1
            completeness = 1
            consistency = 1
            safety = 1
            explanation_parts.append(f"Failed to parse JSON: {e}")
            return EvaluationRatingSchema(
                correctness=correctness,
                completeness=completeness,
                consistency=consistency,
                safety=safety,
                json_validity=json_validity,
                total_score=1.0,
                explanation="; ".join(explanation_parts)
            )

        # 2. Completeness (check required fields)
        required_fields = [
            "incident_id", "timestamp", "organization", "predicted_attack", "confidence",
            "severity", "executive_summary", "technical_summary", "mitre_attack",
            "kill_chain_phase", "affected_assets", "recommended_actions", "containment_steps",
            "confidence_reasoning", "limitations", "references", "explainability",
            "federated_model_version", "global_checkpoint_version", "dataset_version",
            "benchmark_version", "prompt_version", "llm_provider", "llm_model"
        ]
        
        missing = [f for f in required_fields if f not in parsed_data]
        if missing:
            completeness = max(1, 5 - len(missing))
            explanation_parts.append(f"Missing schema fields: {missing}")
        else:
            explanation_parts.append("All schema fields are present.")

        # 3. Correctness (check match with inputs)
        expected_attack = inputs.get("predicted_attack")
        expected_org = inputs.get("organization")
        
        attack_in_report = parsed_data.get("predicted_attack")
        org_in_report = parsed_data.get("organization")

        if expected_attack and attack_in_report != expected_attack:
            correctness -= 2
            explanation_parts.append(f"Expected attack '{expected_attack}', got '{attack_in_report}'.")
        if expected_org and org_in_report != expected_org:
            correctness -= 2
            explanation_parts.append(f"Expected organization '{expected_org}', got '{org_in_report}'.")
        
        if correctness == 5:
            explanation_parts.append("Input data matches report parameters.")

        # 4. Consistency (check for placeholder text)
        content_str = json.dumps(parsed_data).lower()
        placeholders = ["todo", "placeholder", "tbd", "insert here", "lorem ipsum"]
        found_placeholders = [p for p in placeholders if p in content_str]
        if found_placeholders:
            consistency = 1
            explanation_parts.append(f"Found placeholder text: {found_placeholders}")
        else:
            explanation_parts.append("No placeholder text found.")

        # 5. Safety (check containment and severity)
        containment = parsed_data.get("containment_steps", [])
        severity = parsed_data.get("severity", "").upper()

        if not containment or len(containment) == 0:
            safety -= 2
            explanation_parts.append("Warning: Containment steps are empty.")
        if severity not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            safety -= 2
            explanation_parts.append(f"Warning: Severity '{severity}' is invalid.")
        
        if safety == 5:
            explanation_parts.append("Containment and severity classification are safe and valid.")

        total_score = (correctness + completeness + consistency + safety + json_validity) / 5.0

        return EvaluationRatingSchema(
            correctness=correctness,
            completeness=completeness,
            consistency=consistency,
            safety=safety,
            json_validity=json_validity,
            total_score=total_score,
            explanation="; ".join(explanation_parts)
        )
