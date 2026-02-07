"""
Course Guide Agent - Agente guía que toma iniciativa como profesor particular
Específico para cursos/exámenes, guía proactivamente al estudiante
"""

from typing import List, Optional, Dict
from langchain_openai import ChatOpenAI
from memory.memory_manager import MemoryManager
import os
import sys
from datetime import datetime

# Importar model_manager
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from model_manager import ModelManager
except ImportError:
    ModelManager = None
    print("⚠️ Warning: model_manager no disponible, usando OpenAI directamente")


class CourseGuideAgent:
    """
    Agente especializado en guiar estudiantes en cursos/exámenes
    Toma iniciativa como un profesor particular
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente guía de cursos
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        self.llm = None
        self.model_manager = None
        self.current_model_config = None
        
        # Inicializar model_manager si está disponible
        if ModelManager:
            try:
                self.model_manager = ModelManager(api_key=self.api_key, mode=mode)
                print("🤖 Course Guide Agent inicializado con ModelManager")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar ModelManager: {e}")
                self.model_manager = None
        else:
            if self.api_key:
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.7,
                        api_key=self.api_key
                    )
                    print("🤖 Course Guide Agent inicializado (sin ModelManager)")
                except Exception as e:
                    print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
            else:
                print("⚠️ Course Guide Agent inicializado sin API key")
    
    def _get_llm(self, use_free_model: bool = False):
        """Obtiene el LLM a usar, con soporte para modelo gratuito"""
        if self.model_manager:
            # Usar ModelManager para selección automática
            if use_free_model:
                # Forzar modelo gratuito (Ollama)
                print("💡 Usando modelo gratuito (Ollama/Llama)")
                try:
                    # Intentar usar Ollama primero
                    model_config, llm = self.model_manager.select_model(
                        task_type="qa",
                        min_quality="low",  # Aceptar calidad baja para modelo gratuito
                        preferred_model="llama3.2"  # Preferir llama3.2
                    )
                    if model_config.provider.value == "ollama":
                        print(f"✅ Usando modelo gratuito: {model_config.name}")
                        self.current_model_config = model_config
                        return llm
                    else:
                        # Si no hay Ollama, usar gpt-3.5-turbo como fallback
                        print("⚠️ Ollama no disponible, usando gpt-3.5-turbo como fallback")
                        model_config, llm = self.model_manager.select_model(
                            task_type="qa",
                            min_quality="low",
                            preferred_model="gpt-3.5-turbo"
                        )
                        self.current_model_config = model_config
                        return llm
                except Exception as e:
                    print(f"⚠️ Error seleccionando modelo gratuito: {e}")
                    # Fallback a gpt-3.5-turbo
                    try:
                        model_config, llm = self.model_manager.select_model(
                            task_type="qa",
                            min_quality="low",
                            preferred_model="gpt-3.5-turbo"
                        )
                        self.current_model_config = model_config
                        return llm
                    except:
                        raise ValueError("No hay modelo disponible. Configura una API key o instala Ollama.")
            else:
                # Selección automática normal (prioriza gratis > barato > caro)
                model_config, llm = self.model_manager.select_model(
                    task_type="qa",
                    min_quality="medium"
                )
                self.current_model_config = model_config
                return llm
        elif self.llm:
            return self.llm
        else:
            raise ValueError("No hay LLM disponible. Configura una API key o instala Ollama.")
    
    def guide_student(
        self,
        question: Optional[str],
        course_title: str,
        exam_date: str,
        topics: List[Dict],
        topic_progress: Dict[str, float],
        current_topic: Optional[str],
        credits_remaining: int,
        conversation_history: Optional[List[Dict]] = None,
        available_tools: Optional[Dict[str, bool]] = None,
        user_id: Optional[str] = None,
        course_id: Optional[str] = None,
        model: Optional[str] = None,
        user_level: Optional[int] = None
    ) -> tuple[str, Dict]:
        """
        Guía al estudiante proactivamente como un profesor particular
        
        Args:
            question: Pregunta del estudiante (opcional, puede ser None para iniciar conversación)
            course_title: Título del curso
            exam_date: Fecha del examen (ISO format)
            topics: Lista de temas con sus PDFs
            topic_progress: Progreso por tema (0-100)
            current_topic: Tema actual seleccionado
            credits_remaining: Créditos restantes del estudiante
            conversation_history: Historial de conversación
            available_tools: Herramientas disponibles en el curso
            user_id: ID del usuario
            course_id: ID del curso
            model: Modelo específico a usar (opcional)
            
        Returns:
            Tupla (respuesta, metadata)
        """
        # Determinar si usar modelo gratuito
        use_free_model = credits_remaining <= 0
        
        # Calcular días hasta el examen
        try:
            exam_datetime = datetime.fromisoformat(exam_date.replace('Z', '+00:00'))
            today = datetime.now(exam_datetime.tzinfo) if exam_datetime.tzinfo else datetime.now()
            days_until = (exam_datetime - today).days
        except:
            days_until = None
        
        # Obtener contexto relevante del tema actual
        context = ""
        if current_topic and user_id and course_id:
            try:
                # Buscar contenido relevante del tema
                relevant_content = self.memory.retrieve_relevant_content(
                    query=current_topic,
                    n_results=5,
                    chat_id=course_id,
                    user_id=user_id
                )
                if relevant_content:
                    context = "\n\nCONTENIDO RELEVANTE DEL TEMA:\n" + "\n---\n".join(relevant_content[:3])
            except Exception as e:
                print(f"⚠️ Error obteniendo contexto: {e}")
        
        # Construir información de temas
        topics_info = []
        for topic in topics:
            topic_name = topic.get("name", "")
            progress = topic_progress.get(topic_name, 0)
            topics_info.append(f"- {topic_name}: {progress:.0f}% completado")
        
        topics_str = "\n".join(topics_info) if topics_info else "No hay temas definidos"
        
        # Construir historial de conversación (con resumen si es largo)
        history_str = ""
        if conversation_history:
            # Si el historial es largo (>15 mensajes), resumirlo
            if len(conversation_history) > 15:
                try:
                    from conversation_summarizer import summarize_conversation_history, format_summarized_history
                    
                    # Resumir historial largo
                    summary_data = summarize_conversation_history(
                        history=conversation_history,
                        api_key=self.api_key if hasattr(self, 'api_key') else None,
                        model=None,  # Usar modo automático
                        max_messages=10,  # Mantener últimos 10 sin resumir
                        use_llm=bool(self.api_key)  # Usar LLM si hay API key
                    )
                    
                    # Formatear resumen
                    summary_text = format_summarized_history(summary_data)
                    
                    # Construir historial: resumen + mensajes recientes
                    recent_parts = []
                    for msg in summary_data.get("recent_messages", []):
                        role = msg.get("role", "user")
                        content = msg.get("content", "")
                        if role == "user":
                            recent_parts.append(f"ESTUDIANTE: {content}")
                        else:
                            recent_parts.append(f"ASISTENTE: {content}")
                    
                    history_str = f"{summary_text}\n\n--- MENSAJES RECIENTES ---\n" + "\n".join(recent_parts)
                    print(f"📝 Historial resumido: {len(conversation_history)} mensajes → resumen + {len(summary_data.get('recent_messages', []))} recientes")
                except Exception as e:
                    print(f"⚠️ Error resumiendo historial, usando últimos 10 mensajes: {e}")
                    # Fallback: usar últimos 10 mensajes
                    history_parts = []
                    for msg in conversation_history[-10:]:
                        role = msg.get("role", "user")
                        content = msg.get("content", "")
                        if role == "user":
                            history_parts.append(f"ESTUDIANTE: {content}")
                        else:
                            history_parts.append(f"ASISTENTE: {content}")
                    history_str = "\n".join(history_parts)
            else:
                # Historial corto: usar todos los mensajes
                history_parts = []
                for msg in conversation_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "user":
                        history_parts.append(f"ESTUDIANTE: {content}")
                    else:
                        history_parts.append(f"ASISTENTE: {content}")
                history_str = "\n".join(history_parts)
        
        # Herramientas disponibles
        tools_str = ""
        if available_tools:
            available = [tool for tool, enabled in available_tools.items() if enabled]
            if available:
                tools_str = f"\n\nHERRAMIENTAS DISPONIBLES EN ESTE CURSO:\n- " + "\n- ".join(available)
        
        # Determinar tema más débil (menor progreso)
        weakest_topic = None
        if topic_progress:
            weakest_topic = min(topic_progress.items(), key=lambda x: x[1])[0] if topic_progress else None
        
        # Construir prompt del sistema
        system_prompt = f"""Eres un profesor particular experto que guía a estudiantes en su preparación para exámenes.

TU ROL:
- Actúas como un profesor particular que toma INICIATIVA
- Guías proactivamente al estudiante según su progreso y tiempo restante
- Eres empático, motivador y pedagógico
- Adaptas tu enseñanza al nivel y ritmo del estudiante

CONTEXTO DEL CURSO:
- Curso: {course_title}
- Fecha del examen: {exam_date}
- Días restantes: {days_until if days_until is not None else "No disponible"}
{tools_str}

TEMAS DEL CURSO Y PROGRESO:
{topics_str}

TEMA ACTUAL SELECCIONADO: {current_topic or "Ninguno"}

PROGRESO GENERAL:
- Tema más débil: {weakest_topic or "No disponible"}
- Créditos restantes: {credits_remaining} ({"Usando modelo gratuito" if use_free_model else "Créditos disponibles"})

INSTRUCCIONES CRÍTICAS:

1. **TOMA INICIATIVA**:
   - Si el estudiante no pregunta nada específico, SUGIERE qué hacer a continuación
   - Analiza su progreso y recomienda temas a reforzar
   - Considera los días restantes para el examen
   - Propón actividades concretas (tests, ejercicios, repaso de apuntes)

2. **GUÍA PROACTIVA**:
   - Si un tema tiene bajo progreso (<50%), sugiere enfocarse en él
   - Si el examen está cerca (<7 días), prioriza repaso y práctica
   - Si hay mucho tiempo (>30 días), sugiere estudio profundo
   - Siempre termina tus respuestas con sugerencias concretas de siguiente paso

3. **FORMATO DE RESPUESTA**:
   - Usa Markdown para estructura clara
   - Sé conciso pero completo
   - Incluye ejemplos cuando sea útil
   - Al final, añade una sección "📌 Próximos Pasos Sugeridos" con acciones concretas

4. **USO DE HERRAMIENTAS**:
   - Sugiere usar herramientas disponibles cuando sean útiles
   - Ejemplos: "Te recomiendo hacer un test sobre [tema]" o "Genera apuntes de [tema] para repasar"

5. **MOTIVACIÓN**:
   - Reconoce el progreso del estudiante
   - Sé alentador pero realista
   - Ayuda a mantener el enfoque

IMPORTANTE:
- Si no hay créditos, simplifica las respuestas pero mantén la calidad educativa
- Usa el contexto del tema actual cuando esté disponible
- Mantén un tono profesional pero cercano"""

        # Construir prompt del usuario
        if question:
            user_prompt = f"""PREGUNTA DEL ESTUDIANTE:
{question}

{context}

HISTORIAL DE CONVERSACIÓN:
{history_str if history_str else "No hay historial previo."}

Responde la pregunta del estudiante de manera clara y educativa, y al final sugiere próximos pasos concretos basados en su progreso y tiempo restante."""
        else:
            # Iniciar conversación proactivamente
            if user_level is not None:
                # El usuario ha indicado su nivel (1-10)
                level_description = {
                    1: "principiante absoluto",
                    2: "principiante",
                    3: "principiante con conocimientos básicos",
                    4: "nivel básico",
                    5: "nivel intermedio-bajo",
                    6: "nivel intermedio",
                    7: "nivel intermedio-alto",
                    8: "nivel avanzado",
                    9: "nivel muy avanzado",
                    10: "experto"
                }.get(user_level, "intermedio")
                
                user_prompt = f"""El estudiante acaba de entrar al curso y ha indicado que su nivel actual es {user_level}/10 ({level_description}).

{context}

HISTORIAL DE CONVERSACIÓN:
{history_str if history_str else "No hay historial previo."}

Saluda al estudiante de manera cálida y personaliza tu mensaje según su nivel ({user_level}/10). 
- Si es nivel bajo (1-4): Ofrece una guía paso a paso, explica conceptos básicos, y sé muy paciente y alentador.
- Si es nivel medio (5-7): Sugiere actividades prácticas, ejercicios, y refuerzo de conceptos clave.
- Si es nivel alto (8-10): Enfócate en práctica avanzada, optimización, y preparación para el examen.

Toma INICIATIVA sugiriendo qué hacer a continuación basándote en:
- Su nivel actual ({user_level}/10)
- Los días restantes hasta el examen
- Los temas del curso disponibles
- Las herramientas disponibles

Sé proactivo y motivador. Sugiere acciones concretas adaptadas a su nivel."""
            else:
                # Sin nivel indicado (caso legacy)
                user_prompt = f"""El estudiante acaba de entrar al curso. No ha hecho ninguna pregunta aún.

{context}

HISTORIAL DE CONVERSACIÓN:
{history_str if history_str else "No hay historial previo."}

Saluda al estudiante y toma INICIATIVA sugiriendo qué hacer a continuación basándote en:
- Su progreso actual en los temas
- Los días restantes hasta el examen
- Los temas que necesitan más atención
- Las herramientas disponibles

Sé proactivo y motivador. Sugiere acciones concretas."""
        
        try:
            llm = self._get_llm(use_free_model=use_free_model)
            
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            response = llm.invoke(messages)
            answer = response.content
            
            # Metadata
            metadata = {
                "model_used": model or (self.current_model_config.name if self.current_model_config else "gpt-3.5-turbo"),
                "use_free_model": use_free_model,
                "credits_remaining": credits_remaining,
                "days_until_exam": days_until,
                "current_topic": current_topic,
            }
            
            return answer, metadata
            
        except Exception as e:
            error_msg = f"Error al generar respuesta: {str(e)}"
            print(f"❌ {error_msg}")
            import traceback
            traceback.print_exc()
            
            return error_msg, {
                "error": str(e),
                "use_free_model": use_free_model
            }

