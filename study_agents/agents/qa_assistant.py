"""
Q&A Assistant Agent - Responde preguntas del estudiante
Usa RAG para buscar información relevante y responde con contexto
"""

# Aplicar parche de proxies antes de importar ChatOpenAI
import sys
import os
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
try:
    import openai_proxy_patch  # noqa: F401
    openai_proxy_patch.patch_langchain_openai()
except:
    pass

from typing import List, Optional
from langchain_openai import ChatOpenAI
from memory.memory_manager import MemoryManager
import re

class QAAssistantAgent:
    """
    Agente especializado en responder preguntas del estudiante
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None):
        """
        Inicializa el agente de Q&A
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional, si no se proporciona usa la del entorno)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.llm = None  # Se inicializará cuando se necesite
        
        if self.api_key:
            try:
                self.llm = ChatOpenAI(
                    model="gpt-4",
                    temperature=0.7,
                    api_key=self.api_key
                )
                print("🤖 Q&A Assistant Agent inicializado")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Q&A Assistant Agent inicializado sin API key (se requerirá para usar)")
    
    def answer_question(self, question: str, user_id: str = "default", model: Optional[str] = "gpt-4-turbo") -> tuple[str, dict]:
        """
        Responde una pregunta del estudiante usando el temario y el historial
        
        Args:
            question: Pregunta del estudiante
            user_id: ID del usuario (para historial)
            model: Modelo de OpenAI a usar (opcional, por defecto gpt-4-turbo)
            
        Returns:
            Respuesta contextualizada
        """
        # Verificar API key
        if not self.api_key:
            return "⚠️ Se requiere configurar una API key de OpenAI para responder preguntas. Por favor, configura tu API key en el modal de configuración.", {"inputTokens": 0, "outputTokens": 0}
        
        # Inicializar LLM con el modelo especificado
        try:
            self.llm = ChatOpenAI(
                model=model,
                temperature=0.7,
                api_key=self.api_key
            )
        except Exception as e:
            # Fallback a gpt-4-turbo si el modelo especificado falla
            try:
                print(f"⚠️ Modelo {model} no disponible, usando gpt-4-turbo como fallback")
                self.llm = ChatOpenAI(
                    model="gpt-4-turbo",
                    temperature=0.7,
                    api_key=self.api_key
                )
            except Exception as e2:
                return f"⚠️ Error al inicializar el modelo: {str(e2)}", {"inputTokens": 0, "outputTokens": 0}
        
        # Recuperar contenido relevante de la memoria
        relevant_content = self.memory.retrieve_relevant_content(question, n_results=5)
        
        # Obtener historial de conversación
        conversation_history = self.memory.get_conversation_history(user_id)
        
        # Construir contexto, limpiando cualquier JSON problemático
        context_parts = []
        if relevant_content:
            for content_part in relevant_content:
                # Limpiar bloques diagram-json del contexto para evitar problemas
                content_cleaned = re.sub(r'```\s*diagram-json\s*\n.*?```', '[Esquema visual]', content_part, flags=re.DOTALL | re.IGNORECASE)
                context_parts.append(content_cleaned)
        context = "\n\n".join(context_parts) if context_parts else "No hay contenido relevante disponible en los documentos procesados."
        
        # Construir historial como string, limpiando cualquier JSON problemático
        history_str = ""
        if conversation_history:
            history_messages = []
            for msg in conversation_history[-5:]:  # Últimas 5 interacciones
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                # Limpiar bloques diagram-json del historial para evitar problemas con llaves
                # Reemplazar bloques JSON con un marcador simple
                content_cleaned = re.sub(r'```\s*diagram-json\s*\n.*?```', '[Esquema visual generado anteriormente]', content, flags=re.DOTALL | re.IGNORECASE)
                if role == 'user':
                    history_messages.append(f"Estudiante: {content_cleaned}")
                elif role == 'assistant':
                    history_messages.append(f"Asistente: {content_cleaned}")
            history_str = "\n".join(history_messages)
        
        # Crear prompt manualmente usando replace para evitar problemas con llaves en el contenido
        prompt_template = """Eres un asistente educativo experto que ayuda a estudiantes a entender conceptos.

Tu objetivo es:
- Responder preguntas de manera clara y educativa usando formato Markdown visual
- Usar el contenido del temario proporcionado cuando esté disponible
- Si no hay información en el temario, puedes usar tu conocimiento general
- Mantener un tono amigable y paciente
- Explicar conceptos de manera sencilla y VISUAL

FORMATO DE RESPUESTA (Markdown ULTRA VISUAL):
- Usa títulos y subtítulos (##, ###)
- Usa **negritas** para conceptos clave
- Crea listas con viñetas para información estructurada
- Si es apropiado, crea esquemas conceptuales usando JSON estructurado (NO uses Mermaid)
- Usa tablas cuando compares conceptos
- Separa secciones con líneas horizontales (---)

**⚠️ CRÍTICO - ESQUEMAS CONCEPTUALES:**
- **NO uses código Mermaid** (NO flowchart, NO graph, NO gantt, NADA de Mermaid)
- **SOLO usa JSON estructurado** dentro de bloques ```diagram-json

Si la pregunta requiere visualización o el usuario pide un esquema, SIEMPRE crea esquemas usando JSON estructurado.

FORMATO JSON REQUERIDO (debe estar en una sola línea dentro del bloque diagram-json):
- Estructura: Un objeto JSON con dos propiedades: nodes (array) y edges (array)
- Cada nodo en nodes debe tener: id (letra mayúscula A-Z), label (texto descriptivo), color (hexadecimal como #6366f1)
- Cada edge en edges debe tener: from (id del nodo origen), to (id del nodo destino)
- El JSON DEBE estar completo y válido - NO lo cortes a mitad de un campo
- Máximo 5 nodos por esquema para mantenerlo simple

**REGLAS PARA ESQUEMAS JSON:**
- IDs: A, B, C, D, E (una letra mayúscula)
- Labels: Texto descriptivo del concepto
- Colors: Usa colores hexadecimales (#6366f1, #10b981, #8b5cf6, #06b6d4, #f59e0b)
- Edges: from y to con los IDs de los nodos
- Máximo 5 nodos por esquema para mantenerlo simple

**IMPORTANTE:** Si el usuario pide un esquema, diagrama o mapa conceptual, SIEMPRE genera un esquema usando el formato JSON descrito arriba dentro de un bloque ```diagram-json

CONTEXTO DEL TEMARIO:
__CONTEXT_PLACEHOLDER__

HISTORIAL DE CONVERSACIÓN:
__HISTORY_PLACEHOLDER__

PREGUNTA DEL ESTUDIANTE: __QUESTION_PLACEHOLDER__

Responde de manera clara, completa y VISUAL usando Markdown. Si el contexto del temario es relevante, úsalo. Si la pregunta requiere visualización o pide un esquema, crea esquemas conceptuales usando JSON estructurado (bloques ```diagram-json) - NO uses Mermaid de ningún tipo."""

        # Reemplazar placeholders de forma segura (sin usar f-strings que interpretan llaves)
        full_prompt = prompt_template.replace("__CONTEXT_PLACEHOLDER__", context)
        full_prompt = full_prompt.replace("__HISTORY_PLACEHOLDER__", history_str or "No hay historial previo de conversación.")
        full_prompt = full_prompt.replace("__QUESTION_PLACEHOLDER__", question)

        try:
            # Usar invoke directamente en lugar de ChatPromptTemplate para evitar problemas con llaves
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content="Eres un asistente educativo experto que ayuda a estudiantes a entender conceptos."),
                HumanMessage(content=full_prompt)
            ]
            response = self.llm.invoke(messages)
            
            answer = response.content
            
            # Capturar tokens de uso
            usage_info = {
                "inputTokens": 0,
                "outputTokens": 0
            }
            
            # Intentar obtener tokens de la metadata de la respuesta
            if hasattr(response, 'response_metadata') and response.response_metadata:
                token_usage = response.response_metadata.get('token_usage', {})
                usage_info["inputTokens"] = token_usage.get('prompt_tokens', 0)
                usage_info["outputTokens"] = token_usage.get('completion_tokens', 0)
            
            # POST-PROCESAMIENTO: Eliminar cualquier bloque Mermaid que el modelo pueda haber generado
            # Detectar y eliminar bloques de código Mermaid (multilínea)
            mermaid_patterns = [
                r'```\s*mermaid\s*\n.*?```',
                r'```\s*flowchart\s*\n.*?```',
                r'```\s*graph\s*\n.*?```',
                r'```\s*gantt\s*\n.*?```',
                r'```\s*sequenceDiagram\s*\n.*?```',
                r'```\s*classDiagram\s*\n.*?```',
                r'```\s*mindmap\s*\n.*?```',
            ]
            
            for pattern in mermaid_patterns:
                answer = re.sub(pattern, '', answer, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # Limpiar líneas vacías múltiples
            answer = re.sub(r'\n{3,}', '\n\n', answer)
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", question)
            self.memory.add_to_conversation_history(user_id, "assistant", answer)
            
            return answer, usage_info
            
        except Exception as e:
            error_msg = f"Error al generar respuesta: {str(e)}"
            print(f"❌ {error_msg}")
            return f"Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo. Error: {str(e)}", {"inputTokens": 0, "outputTokens": 0}
    
    def clarify_concept(self, concept: str, user_id: str = "default") -> str:
        """
        Aclara un concepto específico
        
        Args:
            concept: Concepto a aclarar
            user_id: ID del usuario
            
        Returns:
            Aclaración del concepto
        """
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=3)
        
        if not relevant_content:
            return f"No se encontró información sobre '{concept}' en los documentos procesados. ¿Podrías subir documentos que contengan este concepto?"
        
        prompt = f"""Aclara el concepto '{concept}' de manera detallada y educativa:

CONTENIDO DEL TEMARIO:
{chr(10).join(relevant_content)}

Proporciona:
- Definición clara
- Ejemplos prácticos
- Analogías para facilitar la comprensión
- Relación con otros conceptos si es relevante"""

        try:
            response = self.llm.invoke(prompt)
            clarification = response.content
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", f"Aclara el concepto: {concept}")
            self.memory.add_to_conversation_history(user_id, "assistant", clarification)
            
            return clarification
        except Exception as e:
            return f"Error al aclarar el concepto: {str(e)}"
