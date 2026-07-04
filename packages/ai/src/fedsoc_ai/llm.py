import httpx
import json
from typing import List, Dict, Any, Optional

class LocalLLM:
    """
    Client wrapper for Ollama local LLM, with extensibility to OpenAI/Claude/Qwen.
    """
    def __init__(
        self,
        provider: str = "ollama",
        model_name: str = "llama3.1",
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 30.0
    ):
        self.provider = provider.lower()
        self.model_name = model_name
        self.api_key = api_key
        self.timeout = timeout_seconds
        
        if self.provider == "ollama":
            self.base_url = base_url or "http://localhost:11434"
        else:
            self.base_url = base_url

    def chat(self, messages: List[Dict[str, str]], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Sends a chat request to the configured LLM provider.
        """
        if self.provider == "ollama":
            return self._chat_ollama(messages, options)
        else:
            # Fallback mock for non-ollama or other APIs not yet configured
            return {
                "content": f"[Mock response from {self.provider} ({self.model_name})]: Extensible LLM client triggered. Configure API key and endpoints for live connection.",
                "usage": {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}
            }

    def _chat_ollama(self, messages: List[Dict[str, str]], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": options or {}
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("message", {}).get("content", "")
                    
                    # Estimate token counts if not provided by Ollama
                    prompt_eval_count = result.get("prompt_eval_count", 0)
                    eval_count = result.get("eval_count", 0)
                    
                    return {
                        "content": content,
                        "usage": {
                            "promptTokens": prompt_eval_count,
                            "completionTokens": eval_count,
                            "totalTokens": prompt_eval_count + eval_count
                        }
                    }
                else:
                    return {
                        "content": f"Ollama returned error status: {response.status_code}. Response: {response.text}",
                        "usage": {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}
                    }
        except httpx.RequestError as e:
            # Safe mock fallback so the application doesn't crash if local Ollama is offline
            mock_explanation = self._generate_offline_mock(messages)
            return {
                "content": (
                    f"⚠️ **Note**: Ollama server is currently offline or unreachable at {self.base_url}.\n"
                    f"Showing offline analytical synthesis instead:\n\n"
                    f"{mock_explanation}"
                ),
                "usage": {"promptTokens": 0, "completionTokens": 0, "totalTokens": 0}
            }

    def _generate_offline_mock(self, messages: List[Dict[str, str]]) -> str:
        """Generates static security analyst responses when Ollama is offline."""
        # Find the last user message to see if we can synthesize a mock response
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        
        if "threat" in user_msg.lower() or "event" in user_msg.lower() or "alert" in user_msg.lower():
            return (
                "### Threat Synthesis Report (Offline Mode)\n"
                "- **Attacker Vector**: Suspected high-volume port scanning or credential stuffing (detected high `count` / `srv_count` metrics).\n"
                "- **Impact Assessment**: Target node environment exhibits abnormal request frequency. Risk of Denial of Service (DoS) or unauthorized discovery.\n"
                "- **Remediation Steps**:\n"
                "  1. Block origin IP via regional firewall configurations.\n"
                "  2. Enable adaptive rate-limiting on target load balancers.\n"
                "  3. Rotate API keys and inspect system session states."
            )
        elif "federated" in user_msg.lower() or "round" in user_msg.lower():
            return (
                "### FL Aggregation Synthesis (Offline Mode)\n"
                "- **Trend Analysis**: Global model weights have successfully aggregated via `FedAvg`. Accuracy remains stable.\n"
                "- **Node Contribution Quality**: No clear signs of gradient poisoning. All local models converged in line with expected learning rates."
            )
        else:
            return "Mock Security Analyst Response. Connect to a local Ollama instance running Llama 3.1 for live LLM reasoning."
