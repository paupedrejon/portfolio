"""
Model Manager - Gestión inteligente de modelos LLM
Optimiza costes seleccionando automáticamente el modelo más barato disponible
Prioridad: Gratis (Ollama) > Barato (GPT-3.5) > Caro (GPT-4)
"""

import os
from typing import Optional, Dict, List, Tuple, Any
from enum import Enum
import logging

try:
    import requests
except ImportError:
    requests = None

logger = logging.getLogger(__name__)


class ModelProvider(Enum):
    """Proveedores de modelos disponibles"""
    OLLAMA = "ollama"  # Gratis, local
    OPENAI = "openai"  # De pago
    HUGGINGFACE = "huggingface"  # Algunos modelos gratuitos


class ModelConfig:
    """Configuración de un modelo"""
    
    def __init__(
        self,
        name: str,
        provider: ModelProvider,
        cost_per_1k_input: float = 0.0,
        cost_per_1k_output: float = 0.0,
        max_tokens: Optional[int] = None,
        available: bool = True,
        requires_api_key: bool = False,
        quality_level: str = "medium"  # "low", "medium", "high"
    ):
        self.name = name
        self.provider = provider
        self.cost_per_1k_input = cost_per_1k_input
        self.cost_per_1k_output = cost_per_1k_output
        self.max_tokens = max_tokens
        self.available = available
        self.requires_api_key = requires_api_key
        self.quality_level = quality_level
    
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estima el costo de una llamada"""
        input_cost = (input_tokens / 1000) * self.cost_per_1k_input
        output_cost = (output_tokens / 1000) * self.cost_per_1k_output
        return input_cost + output_cost
    
    def __repr__(self):
        cost_str = f"${self.cost_per_1k_input:.4f}/{self.cost_per_1k_output:.4f}" if self.cost_per_1k_input > 0 else "GRATIS"
        return f"ModelConfig(name={self.name}, provider={self.provider.value}, cost={cost_str}, quality={self.quality_level})"


class ModelManager:
    """
    Gestor de modelos que selecciona automáticamente el modelo más barato disponible
    """
    
    # Configuración de modelos disponibles (ordenados por costo)
    MODELS: List[ModelConfig] = [
        # Modelos GRATIS (Ollama - local)
        ModelConfig(
            name="llama3.2",
            provider=ModelProvider.OLLAMA,
            cost_per_1k_input=0.0,
            cost_per_1k_output=0.0,
            max_tokens=8192,
            requires_api_key=False,
            quality_level="medium"
        ),
        ModelConfig(
            name="llama3.1",
            provider=ModelProvider.OLLAMA,
            cost_per_1k_input=0.0,
            cost_per_1k_output=0.0,
            max_tokens=8192,  # Límite razonable para Ollama
            requires_api_key=False,
            quality_level="high"
        ),
        ModelConfig(
            name="mistral",
            provider=ModelProvider.OLLAMA,
            cost_per_1k_input=0.0,
            cost_per_1k_output=0.0,
            max_tokens=8192,
            requires_api_key=False,
            quality_level="medium"
        ),
        ModelConfig(
            name="phi3",
            provider=ModelProvider.OLLAMA,
            cost_per_1k_input=0.0,
            cost_per_1k_output=0.0,
            max_tokens=4096,
            requires_api_key=False,
            quality_level="low"
        ),
        
        # Modelos BARATOS (OpenAI)
        ModelConfig(
            name="gpt-3.5-turbo",
            provider=ModelProvider.OPENAI,
            cost_per_1k_input=0.0005,  # $0.0005 por 1k tokens input
            cost_per_1k_output=0.0015,  # $0.0015 por 1k tokens output
            max_tokens=16384,  # Límite real: 16,385 tokens (usamos 16,384 para seguridad)
            requires_api_key=True,
            quality_level="medium"
        ),
        ModelConfig(
            name="gpt-4o-mini",
            provider=ModelProvider.OPENAI,
            cost_per_1k_input=0.00015,  # $0.00015 por 1k tokens input
            cost_per_1k_output=0.0006,   # $0.0006 por 1k tokens output
            max_tokens=16384,  # Límite real: 16,384 tokens de salida
            requires_api_key=True,
            quality_level="medium"
        ),
        
        # Modelos CAROS (OpenAI) - solo cuando es necesario
        ModelConfig(
            name="gpt-4-turbo",
            provider=ModelProvider.OPENAI,
            cost_per_1k_input=0.01,     # $0.01 por 1k tokens input
            cost_per_1k_output=0.03,    # $0.03 por 1k tokens output
            max_tokens=16384,  # Límite real: 16,384 tokens de salida (aunque el contexto puede ser 128k)
            requires_api_key=True,
            quality_level="high"
        ),
        ModelConfig(
            name="gpt-4o",
            provider=ModelProvider.OPENAI,
            cost_per_1k_input=0.005,    # $0.005 por 1k tokens input
            cost_per_1k_output=0.015,   # $0.015 por 1k tokens output
            max_tokens=16384,  # Límite real: 16,384 tokens de salida (aunque el contexto puede ser 128k)
            requires_api_key=True,
            quality_level="high"
        ),
        ModelConfig(
            name="gpt-4",
            provider=ModelProvider.OPENAI,
            cost_per_1k_input=0.03,     # $0.03 por 1k tokens input
            cost_per_1k_output=0.06,    # $0.06 por 1k tokens output
            max_tokens=8192,  # Límite real: 8,192 tokens
            requires_api_key=True,
            quality_level="high"
        ),
    ]
    
    def __init__(self, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el gestor de modelos
        
        Args:
            api_key: API key de OpenAI (opcional, solo necesario para modelos de OpenAI)
            mode: Modo de selección ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.api_key = api_key
        self.mode = mode
        self.ollama_available = self._check_ollama_availability()
        self._model_cache: Dict[str, Any] = {}
    
    def _check_ollama_availability(self) -> bool:
        """Verifica si Ollama está disponible"""
        if requests is None:
            return False
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self, min_quality: str = "low") -> List[ModelConfig]:
        """
        Obtiene lista de modelos disponibles ordenados por costo
        
        Args:
            min_quality: Calidad mínima requerida ("low", "medium", "high")
        
        Returns:
            Lista de modelos disponibles ordenados de más barato a más caro
        """
        quality_order = {"low": 0, "medium": 1, "high": 2}
        min_quality_level = quality_order.get(min_quality, 0)
        
        available = []
        
        for model in self.MODELS:
            # Verificar disponibilidad según proveedor
            if model.provider == ModelProvider.OLLAMA:
                if not self.ollama_available:
                    continue
            elif model.provider == ModelProvider.OPENAI:
                if not self.api_key:
                    continue
            
            # Verificar calidad mínima
            model_quality_level = quality_order.get(model.quality_level, 0)
            if model_quality_level < min_quality_level:
                continue
            
            available.append(model)
        
        # Ordenar por costo (gratis primero, luego por costo)
        available.sort(key=lambda m: (
            m.cost_per_1k_input + m.cost_per_1k_output,  # Costo total
            quality_order.get(m.quality_level, 0)  # Luego por calidad
        ))
        
        return available
    
    def select_model(
        self,
        task_type: str = "general",
        min_quality: str = "medium",
        preferred_model: Optional[str] = None,
        context_length: Optional[int] = None
    ) -> Tuple[ModelConfig, Any]:
        """
        Selecciona el mejor modelo disponible para una tarea
        
        Args:
            task_type: Tipo de tarea ("qa", "generation", "analysis", "general")
            min_quality: Calidad mínima requerida
            preferred_model: Modelo preferido por el usuario (si está disponible)
            context_length: Longitud del contexto requerida (en tokens)
        
        Returns:
            Tupla (ModelConfig, LLM instance)
        """
        # Si hay un modelo preferido y está disponible, usarlo
        if preferred_model:
            for model in self.MODELS:
                if model.name == preferred_model:
                    if model.provider == ModelProvider.OLLAMA and not self.ollama_available:
                        break
                    if model.provider == ModelProvider.OPENAI and not self.api_key:
                        break
                    if context_length and model.max_tokens and context_length > model.max_tokens:
                        break
                    llm = self._create_llm(model)
                    if llm:
                        logger.info(f"✅ Usando modelo preferido: {model.name}")
                        return model, llm
        
        # Modo automático: seleccionar el más barato disponible
        if self.mode == "auto":
            available_models = self.get_available_models(min_quality=min_quality)
            
            # Filtrar por longitud de contexto si se especifica
            if context_length:
                available_models = [
                    m for m in available_models
                    if not m.max_tokens or m.max_tokens >= context_length
                ]
            
            # Intentar cada modelo hasta encontrar uno que funcione
            for model in available_models:
                try:
                    llm = self._create_llm(model)
                    if llm:
                        logger.info(f"✅ Modelo seleccionado automáticamente: {model.name} (${model.cost_per_1k_input:.4f}/{model.cost_per_1k_output:.4f} por 1k tokens)")
                        return model, llm
                except Exception as e:
                    logger.warning(f"⚠️ No se pudo crear modelo {model.name}: {e}")
                    continue
            
            # Si ningún modelo funciona, lanzar error
            raise RuntimeError("No hay modelos disponibles. Verifica que Ollama esté instalado o que tengas una API key de OpenAI configurada.")
        
        # Modo manual: usar el primer modelo disponible
        else:
            available_models = self.get_available_models(min_quality=min_quality)
            if not available_models:
                raise RuntimeError("No hay modelos disponibles.")
            model = available_models[0]
            llm = self._create_llm(model)
            return model, llm
    
    def _create_llm(self, model_config: ModelConfig) -> Optional[Any]:
        """
        Crea una instancia de LLM según la configuración del modelo
        
        Args:
            model_config: Configuración del modelo
        
        Returns:
            Instancia de LLM o None si no se puede crear
        """
        try:
            if model_config.provider == ModelProvider.OLLAMA:
                return self._create_ollama_llm(model_config)
            elif model_config.provider == ModelProvider.OPENAI:
                return self._create_openai_llm(model_config)
            else:
                return None
        except Exception as e:
            logger.error(f"Error creando LLM {model_config.name}: {e}")
            return None
    
    def _create_ollama_llm(self, model_config: ModelConfig) -> Optional[Any]:
        """Crea un LLM de Ollama"""
        try:
            from langchain_community.llms import Ollama
            from langchain_community.chat_models import ChatOllama
            
            # Verificar que el modelo esté disponible en Ollama
            if requests is None:
                logger.warning("⚠️ requests no está instalado. Instala con: pip install requests")
                return None
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=2)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "").split(":")[0] for m in models]
                    
                    # Buscar el modelo o una variante
                    model_name = model_config.name
                    if model_name not in model_names:
                        # Intentar variantes comunes
                        variants = [
                            f"{model_name}:latest",
                            f"{model_name}:8b",
                            f"{model_name}:7b",
                        ]
                        for variant in variants:
                            if any(variant.startswith(name) for name in model_names):
                                model_name = variant.split(":")[0]
                                break
                        else:
                            # Si no se encuentra, usar el primer modelo disponible
                            if model_names:
                                model_name = model_names[0]
                                logger.warning(f"⚠️ Modelo {model_config.name} no encontrado, usando {model_name}")
                            else:
                                logger.error("❌ No hay modelos instalados en Ollama")
                                return None
            except Exception as e:
                logger.warning(f"⚠️ No se pudo verificar modelos de Ollama: {e}")
                return None
            
            # Crear instancia de ChatOllama
            llm = ChatOllama(
                model=model_name,
                base_url="http://localhost:11434",
                temperature=0.7
            )
            
            logger.info(f"✅ LLM de Ollama creado: {model_name}")
            return llm
            
        except ImportError:
            logger.warning("⚠️ langchain_community no está instalado. Instala con: pip install langchain-community")
            return None
        except Exception as e:
            logger.error(f"❌ Error creando LLM de Ollama: {e}")
            return None
    
    def _create_openai_llm(self, model_config: ModelConfig) -> Optional[Any]:
        """Crea un LLM de OpenAI"""
        try:
            from langchain_openai import ChatOpenAI
            
            if not self.api_key:
                logger.warning("⚠️ API key de OpenAI no proporcionada")
                return None
            
            # Asegurar que max_tokens no exceda los límites del modelo
            # max_tokens se refiere a tokens de salida (completion tokens), no al contexto total
            max_output_tokens = model_config.max_tokens
            if max_output_tokens is None:
                max_output_tokens = None
            else:
                # Límites reales de tokens de salida por modelo
                # Nota: El contexto puede ser mayor, pero la salida tiene límites más estrictos
                model_output_limits = {
                    "gpt-3.5-turbo": 16384,
                    "gpt-4o-mini": 16384,
                    "gpt-4-turbo": 16384,
                    "gpt-4o": 16384,
                    "gpt-4": 8192,
                }
                if model_config.name in model_output_limits:
                    max_output_tokens = min(max_output_tokens, model_output_limits[model_config.name])
            
            llm = ChatOpenAI(
                model=model_config.name,
                temperature=0.7,
                api_key=self.api_key,
                max_tokens=max_output_tokens
            )
            
            logger.info(f"✅ LLM de OpenAI creado: {model_config.name} (max_tokens={max_output_tokens})")
            return llm
            
        except ImportError:
            logger.warning("⚠️ langchain_openai no está instalado")
            return None
        except Exception as e:
            logger.error(f"❌ Error creando LLM de OpenAI: {e}")
            return None
    
    def get_model_info(self, model_name: str) -> Optional[ModelConfig]:
        """Obtiene información de un modelo específico"""
        for model in self.MODELS:
            if model.name == model_name:
                return model
        return None
    
    def estimate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        """Estima el costo de usar un modelo específico"""
        model = self.get_model_info(model_name)
        if model:
            return model.estimate_cost(input_tokens, output_tokens)
        return 0.0

