import httpx
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from loguru import logger

class BaseLLMProvider(ABC):
    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], json_format: bool = False) -> Dict[str, Any]:
        """
        Sends chat completion messages to the provider.
        Returns a dict: {"content": str, "usage": {"promptTokens": int, "completionTokens": int}}
        """
        pass

class OllamaProvider(BaseLLMProvider):
    def __init__(self, model: str = "llama3.1", base_url: str = "http://localhost:11434", timeout: float = 30.0):
        self.model = model
        self.base_url = base_url
        self.timeout = timeout

    def chat(self, messages: List[Dict[str, str]], json_format: bool = False) -> Dict[str, Any]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.1}
        }
        if json_format:
            payload["format"] = "json"

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json.get("message", {}).get("content", "")
                    prompt_eval = res_json.get("prompt_eval_count", 0)
                    eval_count = res_json.get("eval_count", 0)
                    return {
                        "content": content,
                        "usage": {
                            "promptTokens": prompt_eval,
                            "completionTokens": eval_count,
                            "totalTokens": prompt_eval + eval_count
                        }
                    }
                else:
                    raise RuntimeError(f"Ollama returned error {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Ollama provider failed: {e}")
            raise e

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, model: str = "gpt-4o-mini", api_key: Optional[str] = None, timeout: float = 30.0):
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

    def chat(self, messages: List[Dict[str, str]], json_format: bool = False) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("OpenAI API Key is missing.")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1
        }
        if json_format:
            payload["response_format"] = {"type": "json_object"}

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                    usage = res_json.get("usage", {})
                    return {
                        "content": content,
                        "usage": {
                            "promptTokens": usage.get("prompt_tokens", 0),
                            "completionTokens": usage.get("completion_tokens", 0),
                            "totalTokens": usage.get("total_tokens", 0)
                        }
                    }
                else:
                    raise RuntimeError(f"OpenAI returned error {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"OpenAI provider failed: {e}")
            raise e
