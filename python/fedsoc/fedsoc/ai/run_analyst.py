import sys
import json
from fedsoc.ai.service import AISOCAnalystService

def main():
    try:
        # Read detection input parameters from stdin
        input_data = json.loads(sys.stdin.read())
        
        provider = input_data.get("provider", "ollama")
        model = input_data.get("model", "llama3.1")
        api_key = input_data.get("api_key")

        # Initialize service
        service = AISOCAnalystService(provider_name=provider, model_name=model, api_key=api_key)
        
        # Analyze incident
        report, evals = service.analyze_incident(input_data)

        # Print output JSON to stdout
        output = {
            "success": True,
            "report": report,
            "evaluations": evals
        }
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
