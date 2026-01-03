"""
Study Agents - Sistema Multi-Agente para Autoaprendizaje
Sistema principal que coordina todos los agentes
"""

import os
from typing import Optional
from dotenv import load_dotenv

# APLICAR PARCHE DE PROXIES ANTES DE CUALQUIER IMPORTACIÓN DE AGENTES
import openai_proxy_patch  # noqa: F401
# Forzar aplicación del parche de LangChain también
try:
    openai_proxy_patch.patch_langchain_openai()
except:
    pass  # Se aplicará cuando se importe langchain_openai

from agents.content_processor import ContentProcessorAgent
from agents.explanation_agent import ExplanationAgent
from agents.qa_assistant import QAAssistantAgent
from agents.test_generator import TestGeneratorAgent
from agents.feedback_agent import FeedbackAgent
from memory.memory_manager import MemoryManager

# Cargar variables de entorno desde el archivo .env
# Buscar en el directorio actual y en el directorio del script
import os
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)  # Cargar desde la ubicación específica
load_dotenv()  # También intentar desde el directorio actual

class StudyAgentsSystem:
    """
    Sistema principal que coordina todos los agentes
    """
    
    def __init__(self, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el sistema y todos los agentes
        
        Args:
            api_key: API key de OpenAI del usuario (opcional)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        # Usar API key proporcionada o de entorno
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        
        # Inicializar memoria con API key
        self.memory = MemoryManager(api_key=self.api_key)
        
        # Inicializar todos los agentes con la misma API key y modo automático
        self.content_processor = ContentProcessorAgent(memory=self.memory)
        self.explanation_agent = ExplanationAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        self.qa_assistant = QAAssistantAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        self.test_generator = TestGeneratorAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        self.feedback_agent = FeedbackAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        
        print("✅ Sistema Study Agents inicializado correctamente")
        print(f"📚 Memoria: {self.memory.get_memory_type()}")
        print(f"🔧 Modo: {mode} (optimización automática de costes activada)")
        if self.api_key:
            print("🔑 API Key configurada")
        else:
            print("💡 Sin API key - intentando usar Ollama (gratis) si está disponible")
    
    def upload_documents(self, document_paths: list[str]) -> dict:
        """
        Procesa documentos subidos por el usuario
        
        Args:
            document_paths: Lista de rutas a los documentos
            
        Returns:
            Información del procesamiento
        """
        print("\n📄 Procesando documentos...")
        
        # Limpiar documentos anteriores antes de procesar nuevos
        # Esto asegura que solo se use el contenido del PDF más reciente
        print("🗑️ Limpiando documentos anteriores...")
        self.memory.clear_all_documents()
        print("✅ Documentos anteriores eliminados")
        
        processed_content = self.content_processor.process_documents(document_paths)
        print("✅ Documentos procesados y almacenados en memoria")
        return processed_content
    
    def generate_explanations(self) -> dict:
        """
        Genera explicaciones claras del contenido procesado
        
        Returns:
            Explicaciones generadas
        """
        print("\n📖 Generando explicaciones...")
        explanations = self.explanation_agent.generate_explanations()
        print("✅ Explicaciones generadas")
        return explanations
    
    def generate_notes(self, topics: Optional[list[str]] = None, model: Optional[str] = None) -> str:
        """
        Genera apuntes completos en formato Markdown
        
        Args:
            topics: Lista de temas específicos (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            
        Returns:
            Apuntes en formato Markdown
        """
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n📝 Generando apuntes con modelo {model_str}...")
        notes = self.explanation_agent.generate_notes(topics=topics, model=model)
        print("✅ Apuntes generados")
        return notes
    
    def ask_question(self, question: str, user_id: str = "default", model: Optional[str] = None) -> tuple[str, dict]:
        """
        Responde una pregunta del estudiante
        
        Args:
            question: Pregunta del estudiante
            user_id: ID del usuario (para historial)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            
        Returns:
            Tupla con (respuesta contextualizada, información de tokens)
        """
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n❓ Pregunta: {question} (modelo: {model_str})")
        answer, usage_info = self.qa_assistant.answer_question(question, user_id, model=model)
        print(f"💡 Respuesta generada")
        return answer, usage_info
    
    def generate_test(self, difficulty: str = "medium", num_questions: int = 10, topics: Optional[list[str]] = None, constraints: Optional[str] = None, model: Optional[str] = None, conversation_history: Optional[list[dict]] = None) -> tuple[dict, dict]:
        """
        Genera un test personalizado
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            num_questions: Número de preguntas
            topics: Temas específicos (opcional)
            constraints: Restricciones o condiciones específicas para las preguntas (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            conversation_history: Historial de conversación del chat (opcional)
            
        Returns:
            Tupla con (test generado, información de tokens)
        """
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n📝 Generando test ({difficulty}, {num_questions} preguntas) con modelo {model_str}...")
        test = self.test_generator.generate_test(difficulty, num_questions, topics, constraints=constraints, model=model, conversation_history=conversation_history)
        print("✅ Test generado")
        
        # Extraer información de tokens del test
        usage_info = test.get("usage_info", {"inputTokens": 0, "outputTokens": 0})
        # Remover usage_info del test antes de devolverlo
        test_clean = {k: v for k, v in test.items() if k != "usage_info"}
        
        return test_clean, usage_info
    
    def grade_test(self, test_id: str, answers: dict) -> dict:
        """
        Corrige un test y proporciona feedback
        
        Args:
            test_id: ID del test
            answers: Diccionario con las respuestas del estudiante
            
        Returns:
            Feedback detallado
        """
        print(f"\n✏️ Corrigiendo test {test_id}...")
        
        # Obtener el test primero
        test = self.test_generator.get_test(test_id)
        if "error" in test:
            return {"error": test["error"]}
        
        feedback = self.feedback_agent.grade_test(test_id, answers, test_data=test)
        print("✅ Feedback generado")
        return feedback


def main():
    """Función principal para ejecutar el sistema"""
    print("=" * 70)
    print("🎓 STUDY AGENTS - Sistema Multi-Agente para Autoaprendizaje")
    print("=" * 70)
    
    # Inicializar sistema
    system = StudyAgentsSystem()
    
    # Verificar API key
    if not system.api_key:
        print("\n⚠️  ADVERTENCIA: No se encontró API key de OpenAI")
        print("   El sistema se ha inicializado pero requerirá API key para usar las funciones.")
        print("\n   Para configurar:")
        print("   1. Crea un archivo .env en esta carpeta con:")
        print("      OPENAI_API_KEY=sk-tu-api-key-aqui")
        print("   2. O configura la variable de entorno:")
        print("      $env:OPENAI_API_KEY='sk-tu-api-key-aqui'")
        print("   3. O pásala al inicializar: system = StudyAgentsSystem(api_key='sk-...')")
    else:
        print("\n✅ API key configurada correctamente")
    
    print("\n✅ Sistema listo para usar")
    print("📖 Consulta la documentación para más detalles")


if __name__ == "__main__":
    main()
