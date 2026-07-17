"""
Model Manager - Gestión inteligente de modelos LLM
Optimiza costes: Ollama/OpenRouter free → Groq → DeepSeek → OpenAI barato → premium
"""

from __future__ import annotations

import os
from typing import Optional, Dict, List, Tuple, Any
from enum import Enum
import logging

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)

# Keys por petición (inyectadas desde FastAPI)
_REQUEST_PROVIDER_KEYS: Dict[str, str] = {}


def set_request_provider_keys(keys: Optional[Dict[str, str]]) -> None:
    global _REQUEST_PROVIDER_KEYS
    _REQUEST_PROVIDER_KEYS = {k: v for k, v in (keys or {}).items() if v}


def get_request_provider_keys() -> Dict[str, str]:
    return dict(_REQUEST_PROVIDER_KEYS)


class ModelProvider(Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    DEEPSEEK = "deepseek"
    GROQ = "groq"
    OPENROUTER = "openrouter"


class ModelConfig:
    def __init__(
        self,
        name: str,
        provider: ModelProvider,
        cost_per_1k_input: float = 0.0,
        cost_per_1k_output: float = 0.0,
        max_tokens: Optional[int] = None,
        available: bool = True,
        requires_api_key: bool = False,
        quality_level: str = "medium",
        api_model_id: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.name = name
        self.provider = provider
        self.cost_per_1k_input = cost_per_1k_input
        self.cost_per_1k_output = cost_per_1k_output
        self.max_tokens = max_tokens
        self.available = available
        self.requires_api_key = requires_api_key
        self.quality_level = quality_level
        self.api_model_id = api_model_id or name
        self.base_url = base_url

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        input_cost = (input_tokens / 1000) * self.cost_per_1k_input
        output_cost = (output_tokens / 1000) * self.cost_per_1k_output
        return input_cost + output_cost

    def __repr__(self):
        cost_str = (
            f"${self.cost_per_1k_input:.4f}/{self.cost_per_1k_output:.4f}"
            if self.cost_per_1k_input > 0
            else "GRATIS"
        )
        return f"ModelConfig(name={self.name}, provider={self.provider.value}, cost={cost_str})"


class ModelManager:
    MODELS: List[ModelConfig] = [
        # Local
        ModelConfig("llama3.2", ModelProvider.OLLAMA, 0, 0, 8192, quality_level="medium"),
        ModelConfig("llama3.1", ModelProvider.OLLAMA, 0, 0, 8192, quality_level="high"),
        ModelConfig("mistral", ModelProvider.OLLAMA, 0, 0, 8192, quality_level="medium"),
        ModelConfig("phi3", ModelProvider.OLLAMA, 0, 0, 4096, quality_level="low"),
        ModelConfig("qwen2.5", ModelProvider.OLLAMA, 0, 0, 8192, quality_level="high"),
        # DeepSeek (chino, barato)
        ModelConfig(
            "deepseek-chat",
            ModelProvider.DEEPSEEK,
            0.00014,
            0.00028,
            8192,
            requires_api_key=True,
            quality_level="high",
            base_url="https://api.deepseek.com",
        ),
        ModelConfig(
            "deepseek-reasoner",
            ModelProvider.DEEPSEEK,
            0.00055,
            0.0022,
            8192,
            requires_api_key=True,
            quality_level="premium",
            base_url="https://api.deepseek.com",
        ),
        # Groq (tier gratis)
        ModelConfig(
            "groq/llama-3.3-70b",
            ModelProvider.GROQ,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="high",
            api_model_id="llama-3.3-70b-versatile",
            base_url="https://api.groq.com/openai/v1",
        ),
        ModelConfig(
            "groq/gemma2-9b",
            ModelProvider.GROQ,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="medium",
            api_model_id="gemma2-9b-it",
            base_url="https://api.groq.com/openai/v1",
        ),
        # OpenRouter free (chinos + otros)
        ModelConfig(
            "openrouter/qwen-2.5-72b-free",
            ModelProvider.OPENROUTER,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="high",
            api_model_id="qwen/qwen-2.5-72b-instruct:free",
            base_url="https://openrouter.ai/api/v1",
        ),
        ModelConfig(
            "openrouter/deepseek-chat-free",
            ModelProvider.OPENROUTER,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="high",
            api_model_id="deepseek/deepseek-chat-v3-0324:free",
            base_url="https://openrouter.ai/api/v1",
        ),
        ModelConfig(
            "openrouter/glm-4-9b-free",
            ModelProvider.OPENROUTER,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="medium",
            api_model_id="thudm/glm-4-9b:free",
            base_url="https://openrouter.ai/api/v1",
        ),
        ModelConfig(
            "openrouter/llama-3.2-3b-free",
            ModelProvider.OPENROUTER,
            0,
            0,
            8192,
            requires_api_key=True,
            quality_level="medium",
            api_model_id="meta-llama/llama-3.2-3b-instruct:free",
            base_url="https://openrouter.ai/api/v1",
        ),
        # OpenAI
        ModelConfig("gpt-3.5-turbo", ModelProvider.OPENAI, 0.0005, 0.0015, 4096, requires_api_key=True, quality_level="medium"),
        ModelConfig("gpt-4o-mini", ModelProvider.OPENAI, 0.00015, 0.0006, 4096, requires_api_key=True, quality_level="medium"),
        ModelConfig("gpt-4-turbo", ModelProvider.OPENAI, 0.01, 0.03, 4096, requires_api_key=True, quality_level="high"),
        ModelConfig("gpt-4o", ModelProvider.OPENAI, 0.005, 0.015, 4096, requires_api_key=True, quality_level="high"),
        ModelConfig("gpt-4", ModelProvider.OPENAI, 0.03, 0.06, 4096, requires_api_key=True, quality_level="high"),
        ModelConfig("gpt-5", ModelProvider.OPENAI, 0.015, 0.06, 4096, requires_api_key=True, quality_level="premium"),
        ModelConfig("gpt-5-pro", ModelProvider.OPENAI, 0.03, 0.12, 4096, requires_api_key=True, quality_level="premium"),
    ]

    def __init__(self, api_key: Optional[str] = None, mode: str = "auto", provider_keys: Optional[Dict[str, str]] = None):
        self.api_key = api_key
        self.mode = mode
        self.provider_keys = self._resolve_keys(api_key, provider_keys)
        self.ollama_available = self._check_ollama_availability()
        self._model_cache: Dict[str, Any] = {}

    def _resolve_keys(
        self,
        openai_key: Optional[str],
        provider_keys: Optional[Dict[str, str]],
    ) -> Dict[str, str]:
        keys: Dict[str, str] = {}
        # Env
        env_map = {
            "openai": "OPENAI_API_KEY",
            "deepseek": "DEEPSEEK_API_KEY",
            "groq": "GROQ_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
        }
        for prov, env_name in env_map.items():
            val = os.getenv(env_name)
            if val:
                keys[prov] = val
        # Request / constructor
        for src in (get_request_provider_keys(), provider_keys or {}):
            for k, v in src.items():
                if v:
                    keys[k] = v
        if openai_key:
            keys["openai"] = openai_key
        # Sync self.api_key
        if keys.get("openai"):
            self.api_key = keys["openai"]
        return keys

    def _key_for(self, provider: ModelProvider) -> Optional[str]:
        if provider == ModelProvider.OPENAI:
            return self.provider_keys.get("openai") or self.api_key
        if provider == ModelProvider.DEEPSEEK:
            return self.provider_keys.get("deepseek")
        if provider == ModelProvider.GROQ:
            return self.provider_keys.get("groq")
        if provider == ModelProvider.OPENROUTER:
            return self.provider_keys.get("openrouter")
        return None

    def _check_ollama_availability(self) -> bool:
        if requests is None:
            return False
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            return response.status_code == 200
        except Exception:
            return False

    def get_available_models(self, min_quality: str = "low") -> List[ModelConfig]:
        quality_order = {"low": 0, "medium": 1, "high": 2, "premium": 3}
        min_quality_level = quality_order.get(min_quality, 0)
        available = []

        for model in self.MODELS:
            if model.provider == ModelProvider.OLLAMA and not self.ollama_available:
                continue
            if model.requires_api_key and not self._key_for(model.provider):
                continue
            if quality_order.get(model.quality_level, 0) < min_quality_level:
                continue
            available.append(model)

        available.sort(
            key=lambda m: (
                m.cost_per_1k_input + m.cost_per_1k_output,
                quality_order.get(m.quality_level, 0),
            )
        )
        return available

    def select_model(
        self,
        task_type: str = "general",
        min_quality: str = "medium",
        preferred_model: Optional[str] = None,
        context_length: Optional[int] = None,
        force_premium: bool = False,
    ) -> Tuple[ModelConfig, Any]:
        # Refrescar keys por si cambió el request
        self.provider_keys = self._resolve_keys(self.api_key, self.provider_keys)

        if force_premium:
            min_quality = "premium"
            for premium_model in ("deepseek-reasoner", "gpt-5", "gpt-5-pro"):
                for model in self.MODELS:
                    if model.name != premium_model:
                        continue
                    if model.requires_api_key and not self._key_for(model.provider):
                        continue
                    llm = self._create_llm(model)
                    if llm:
                        logger.info(f"Usando modelo premium: {model.name}")
                        return model, llm

        if preferred_model:
            for model in self.MODELS:
                if model.name != preferred_model:
                    continue
                if model.provider == ModelProvider.OLLAMA and not self.ollama_available:
                    break
                if model.requires_api_key and not self._key_for(model.provider):
                    break
                llm = self._create_llm(model)
                if llm:
                    logger.info(f"Usando modelo preferido: {model.name}")
                    return model, llm

        if self.mode == "auto":
            available_models = self.get_available_models(min_quality=min_quality)
            if context_length:
                available_models = [
                    m for m in available_models
                    if not m.max_tokens or m.max_tokens >= context_length
                ]
            for model in available_models:
                try:
                    llm = self._create_llm(model)
                    if llm:
                        logger.info(f"Modelo auto: {model.name}")
                        return model, llm
                except Exception as e:
                    logger.warning(f"No se pudo crear {model.name}: {e}")
            raise RuntimeError(
                "No hay modelos disponibles. Configura OpenAI, DeepSeek, Groq, OpenRouter u Ollama."
            )

        available_models = self.get_available_models(min_quality=min_quality)
        if not available_models:
            raise RuntimeError("No hay modelos disponibles.")
        model = available_models[0]
        llm = self._create_llm(model)
        return model, llm

    def _create_llm(self, model_config: ModelConfig) -> Optional[Any]:
        try:
            if model_config.provider == ModelProvider.OLLAMA:
                return self._create_ollama_llm(model_config)
            return self._create_openai_compatible_llm(model_config)
        except Exception as e:
            logger.error(f"Error creando LLM {model_config.name}: {e}")
            return None

    def _create_ollama_llm(self, model_config: ModelConfig) -> Optional[Any]:
        try:
            from langchain_community.chat_models import ChatOllama

            if requests is None:
                return None
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=2)
                if response.status_code != 200:
                    return None
                models = response.json().get("models", [])
                model_names = [m.get("name", "").split(":")[0] for m in models]
                model_name = model_config.name
                if model_name not in model_names:
                    if model_names:
                        # Preferir qwen/llama si el pedido no está
                        for candidate in (model_name, "qwen2.5", "llama3.1", "llama3.2"):
                            if candidate in model_names:
                                model_name = candidate
                                break
                        else:
                            model_name = model_names[0]
                    else:
                        return None
            except Exception:
                return None

            return ChatOllama(model=model_name, base_url="http://localhost:11434", temperature=0.7)
        except ImportError:
            logger.warning("langchain_community no instalado")
            return None
        except Exception as e:
            logger.error(f"Error Ollama: {e}")
            return None

    def _create_openai_compatible_llm(self, model_config: ModelConfig) -> Optional[Any]:
        try:
            from langchain_openai import ChatOpenAI

            api_key = self._key_for(model_config.provider)
            if model_config.requires_api_key and not api_key:
                logger.warning(f"Falta API key para {model_config.provider.value}")
                return None

            max_output_tokens = min(model_config.max_tokens or 4096, 4096)
            kwargs: Dict[str, Any] = {
                "model": model_config.api_model_id,
                "temperature": 0.7,
                "api_key": api_key or "not-needed",
                "max_tokens": max_output_tokens,
            }
            if model_config.base_url:
                kwargs["base_url"] = model_config.base_url
            # OpenRouter recomienda headers de atribución
            if model_config.provider == ModelProvider.OPENROUTER:
                kwargs["default_headers"] = {
                    "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "https://www.paupedrejon.com"),
                    "X-Title": "Study Agents",
                }

            llm = ChatOpenAI(**kwargs)
            logger.info(f"LLM creado: {model_config.name} via {model_config.provider.value}")
            return llm
        except ImportError:
            logger.warning("langchain_openai no instalado")
            return None
        except Exception as e:
            logger.error(f"Error LLM compatible: {e}")
            return None

    def get_model_info(self, model_name: str) -> Optional[ModelConfig]:
        for model in self.MODELS:
            if model.name == model_name:
                return model
        return None

    def estimate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        model = self.get_model_info(model_name)
        if model:
            return model.estimate_cost(input_tokens, output_tokens)
        return 0.0
