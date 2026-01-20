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
from agents.exercise_generator import ExerciseGeneratorAgent
from agents.exercise_corrector import ExerciseCorrectorAgent
from agents.correction_agent import CorrectionAgent
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
        self.exercise_generator = ExerciseGeneratorAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        self.exercise_corrector = ExerciseCorrectorAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        self.correction_agent = CorrectionAgent(memory=self.memory, api_key=self.api_key, mode=mode)
        
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
    
    def generate_notes(self, topics: Optional[list[str]] = None, model: Optional[str] = None, user_id: Optional[str] = None, conversation_history: Optional[list[dict]] = None, topic: Optional[str] = None, user_level: Optional[int] = None, chat_id: Optional[str] = None) -> str:
        """
        Genera resumen completo de la conversación en formato Markdown
        
        Args:
            topics: Lista de temas específicos (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            user_id: ID del usuario para obtener su nivel (opcional)
            conversation_history: Historial de conversación para generar resumen actualizado (opcional)
            
        Returns:
            Resumen en formato Markdown
        """
        # Usar el nivel pasado como parámetro, o intentar obtenerlo si no está disponible
        if user_level is None:
            # Priorizar topic sobre topics
            main_topic = topic if topic else (topics[0] if topics and len(topics) > 0 else None)
            
            if user_id and main_topic:
                try:
                    from progress_tracker import ProgressTracker
                    tracker = ProgressTracker()
                    topic_data = tracker.get_topic_level(user_id, main_topic)
                    user_level = topic_data.get("level", 0)
                    print(f"📊 Nivel del usuario en '{main_topic}': {user_level}/10")
                except Exception as e:
                    print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
                    user_level = 0
        
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n📝 Generando resumen con modelo {model_str}...")
        if user_level is not None:
            print(f"📊 Usando nivel del usuario: {user_level}/10")
        
        # Si no hay historial y hay chat_id, usar el título del chat como contexto
        if not conversation_history and chat_id and user_id:
            try:
                from chat_storage import load_chat
                chat_data = load_chat(user_id, chat_id)
                if chat_data and chat_data.get("title"):
                    # Usar el título como contexto inicial
                    if not topic:
                        topic = chat_data.get("title")
                    print(f"📋 Usando título del chat como tema: {chat_data.get('title')}")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el título del chat: {e}")
        
        # Generar apuntes iniciales
        notes, usage_info_notes = self.explanation_agent.generate_notes(topics=topics, model=model, user_level=user_level, conversation_history=conversation_history, topic=topic, chat_id=chat_id, user_id=user_id)
        print(f"💡 Apuntes generados ({len(notes)} caracteres)")
        
        # Revisar y corregir los apuntes usando el agente corrector
        try:
            # Obtener apuntes anteriores si hay historial de conversación
            previous_notes = None
            if conversation_history:
                # Buscar apuntes anteriores en el historial
                for msg in reversed(conversation_history):
                    if msg.get('role') == 'assistant' and ('# ' in msg.get('content', '') or '## ' in msg.get('content', '')):
                        # Parece ser apuntes
                        previous_notes = msg.get('content', '')
                        if len(previous_notes) > 500:  # Solo si es suficientemente largo
                            break
            
            # Revisar y corregir
            print("🔍 Revisando apuntes con agente corrector (verificando variación y calidad)...")
            corrected_notes, needs_correction, correction_analysis, nivel_ajustado = self.correction_agent.review_and_correct(
                response=notes,
                question=f"Generar apuntes sobre {topic or (topics[0] if topics and len(topics) > 0 else 'el tema')}",
                conversation_history=conversation_history,
                topic=topic,
                context=None,  # Los apuntes ya tienen el contexto integrado
                model=model,
                user_level=user_level,
                is_notes=True,
                previous_notes=previous_notes,
                user_id=user_id,
                chat_id=None  # No hay chat_id para apuntes, pero podemos usar user_id y topic
            )
            
            # Aplicar ajuste de nivel si el agente lo recomienda
            if nivel_ajustado is not None and user_id and topic:
                try:
                    from progress_tracker import ProgressTracker
                    tracker = ProgressTracker()
                    # Buscar el chat_id asociado al tema
                    user_progress = tracker.get_user_progress(user_id)
                    if "chats" in user_progress:
                        for cid, chat_data in user_progress["chats"].items():
                            if chat_data.get("topic") == topic:
                                tracker.set_chat_level(user_id, cid, nivel_ajustado, topic)
                                print(f"📊 Nivel ajustado automáticamente: {user_level or 0} → {nivel_ajustado}/10")
                                break
                except Exception as e:
                    print(f"⚠️ Error al ajustar nivel: {e}")
            
            if needs_correction:
                print(f"✅ Apuntes corregidos (problemas detectados: {len(correction_analysis.get('problemas', []))})")
                if correction_analysis.get('problemas'):
                    print(f"   Problemas: {', '.join(correction_analysis['problemas'][:3])}")
                
                # Si se fuerza regeneración porque son muy similares, regenerar completamente
                if correction_analysis.get('force_regeneration'):
                    print("🔄 Regenerando apuntes completamente diferentes...")
                    # Regenerar con instrucciones explícitas de variación
                    notes = self.explanation_agent.generate_notes(
                        topics=topics, 
                        model=model, 
                        user_level=user_level, 
                        conversation_history=conversation_history, 
                        topic=topic
                    )
                    # Usar nivel ajustado si está disponible
                    nivel_a_usar = nivel_ajustado if nivel_ajustado is not None else user_level
                    # Revisar de nuevo
                    corrected_notes2, needs_correction2, _, nivel_ajustado2 = self.correction_agent.review_and_correct(
                        response=notes,
                        question=f"Generar apuntes sobre {topic or (topics[0] if topics and len(topics) > 0 else 'el tema')}",
                        conversation_history=conversation_history,
                        topic=topic,
                        context=None,
                        model=model,
                        user_level=nivel_a_usar,
                        is_notes=True,
                        previous_notes=previous_notes,
                        user_id=user_id,
                        chat_id=None
                    )
                    # Aplicar segundo ajuste de nivel si es necesario
                    if nivel_ajustado2 is not None and user_id and topic:
                        try:
                            from progress_tracker import ProgressTracker
                            tracker = ProgressTracker()
                            user_progress = tracker.get_user_progress(user_id)
                            if "chats" in user_progress:
                                for cid, chat_data in user_progress["chats"].items():
                                    if chat_data.get("topic") == topic:
                                        tracker.set_chat_level(user_id, cid, nivel_ajustado2, topic)
                                        print(f"📊 Nivel ajustado automáticamente (segunda revisión): {nivel_a_usar or 0} → {nivel_ajustado2}/10")
                                        break
                        except Exception as e:
                            print(f"⚠️ Error al ajustar nivel: {e}")
                    return corrected_notes2 if needs_correction2 else notes
                
                return corrected_notes
            else:
                print("✅ Apuntes aprobados (no necesita corrección)")
                return notes
                
        except Exception as e:
            print(f"⚠️ Error en corrección de apuntes, usando apuntes originales: {e}")
            return notes
    
    def _detect_negative_feedback(self, question: str) -> bool:
        """
        Detecta si el usuario está dando feedback negativo o pidiendo mejor calidad
        
        Args:
            question: Pregunta del usuario
            
        Returns:
            True si se detecta feedback negativo o necesidad de alta calidad
        """
        question_lower = question.lower()
        
        # Palabras clave que indican feedback negativo
        negative_keywords = [
            "está mal", "esta mal", "está incorrecto", "esta incorrecto",
            "no es correcto", "no es así", "no es eso", "no es lo que pedí",
            "hazlo mejor", "hazlo de nuevo", "vuelve a hacerlo", "rehazlo",
            "mejor respuesta", "respuesta mejor", "más detallado", "más completo",
            "no entiendo", "no me sirve", "no me ayuda", "no es útil",
            "estás equivocado", "te equivocas", "es incorrecto", "es falso",
            "corrige", "corrigelo", "corrígelo", "arregla", "arreglalo",
            "mejor explicación", "explica mejor", "más claro", "más preciso",
            "no es lo que busco", "no es lo que necesito", "no responde",
            "falta información", "incompleto", "muy simple", "muy básico"
        ]
        
        # Detectar si contiene alguna palabra clave negativa
        for keyword in negative_keywords:
            if keyword in question_lower:
                print(f"⚠️ Feedback negativo detectado: '{keyword}' → Usando modelo premium")
                return True
        
        # Detectar si pregunta explícitamente por mejor calidad
        quality_keywords = [
            "mejor calidad", "máxima calidad", "mejor modelo", "modelo mejor",
            "usa gpt-5", "usa gpt5", "gpt-5", "gpt5", "gpt 5"
        ]
        
        for keyword in quality_keywords:
            if keyword in question_lower:
                print(f"✅ Solicitud de alta calidad detectada: '{keyword}' → Usando modelo premium")
                return True
        
        return False
    
    def ask_question(self, question: str, user_id: str = "default", model: Optional[str] = None, chat_id: Optional[str] = None, topic: Optional[str] = None, initial_form_data: Optional[dict] = None) -> tuple[str, dict]:
        """
        Responde una pregunta del estudiante
        
        Args:
            question: Pregunta del estudiante
            user_id: ID del usuario (para historial)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            chat_id: ID de la conversación (para obtener el nivel)
            topic: Tema del chat (para contextualizar las respuestas)
            
        Returns:
            Tupla con (respuesta contextualizada, información de tokens)
        """
        # Detectar si el usuario está dando feedback negativo o pidiendo mejor calidad
        needs_premium = self._detect_negative_feedback(question)
        
        # Si se detecta feedback negativo y no hay modelo específico, usar GPT-5 automáticamente
        if needs_premium and not model:
            print(f"🚀 Usando GPT-5 automáticamente debido a feedback negativo o solicitud de alta calidad")
        
        model_str = model if model else ("GPT-5 (automático por feedback negativo)" if needs_premium else "automático (optimizando costes)")
        print(f"\n❓ Pregunta: {question} (modelo: {model_str}, tema: {topic or 'General'})")
        
        # Generar respuesta inicial (pasar force_premium si se detectó feedback negativo)
        answer, usage_info = self.qa_assistant.answer_question(
            question, 
            user_id, 
            model=model, 
            chat_id=chat_id, 
            topic=topic,
            force_premium=needs_premium  # Forzar premium si se detectó feedback negativo
        )
        print(f"💡 Respuesta generada ({len(answer)} caracteres)")
        
        # NO usar corrector para flashcards, tests o ejercicios
        # Las flashcards usan user_id="flashcards" y chat_id="flashcards"
        # Los tests y ejercicios tienen su propia lógica de generación
        skip_corrector = (
            user_id == "flashcards" or 
            chat_id == "flashcards" or
            "flashcard" in question.lower() or
            "test" in question.lower() or
            "ejercicio" in question.lower() or
            question.strip().startswith("Genera") and ("conceptos" in question.lower() or "palabras" in question.lower())
        )
        
        if skip_corrector:
            print("⏭️ Saltando corrector (flashcards/tests/ejercicios)")
            return answer, usage_info
        
        # Revisar y corregir la respuesta usando el agente corrector
        try:
            # Obtener historial de conversación para el corrector (solo del chat actual)
            conversation_history = self.memory.get_conversation_history(user_id, chat_id)
            
            # Obtener contexto relevante (solo del chat actual)
            relevant_content = self.memory.retrieve_relevant_content(question, n_results=3, chat_id=chat_id, user_id=user_id)
            context = "\n\n".join(relevant_content) if relevant_content else None
            
            # Si no hay contexto y no hay historial, usar el título del chat como contexto
            if not context and not conversation_history and chat_id:
                try:
                    from chat_storage import load_chat
                    chat_data = load_chat(user_id, chat_id)
                    if chat_data and chat_data.get("title"):
                        context = f"Tema del chat: {chat_data.get('title')}"
                        print(f"📋 Usando título del chat como contexto: {chat_data.get('title')}")
                except Exception as e:
                    print(f"⚠️ No se pudo obtener el título del chat: {e}")
            
            # Obtener nivel del usuario si hay chat_id
            user_level = None
            if user_id and chat_id:
                try:
                    from progress_tracker import ProgressTracker
                    tracker = ProgressTracker()
                    chat_data = tracker.get_chat_level(user_id, chat_id)
                    user_level = chat_data.get("level", 0)
                except Exception as e:
                    print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
            
            # Revisar y corregir
            print("🔍 Revisando respuesta con agente corrector (modo crítico)...")
            corrected_answer, needs_correction, correction_analysis, nivel_ajustado = self.correction_agent.review_and_correct(
                response=answer,
                question=question,
                conversation_history=conversation_history,
                topic=topic,
                context=context,
                model=model,
                user_level=user_level,
                user_id=user_id,
                chat_id=chat_id
            )
            
            # Aplicar ajuste de nivel si el agente lo recomienda
            if nivel_ajustado is not None and user_id and chat_id:
                try:
                    from progress_tracker import ProgressTracker
                    tracker = ProgressTracker()
                    tracker.set_chat_level(user_id, chat_id, nivel_ajustado, topic)
                    print(f"📊 Nivel ajustado automáticamente: {user_level or 0} → {nivel_ajustado}/10")
                except Exception as e:
                    print(f"⚠️ Error al ajustar nivel: {e}")
            
            if needs_correction:
                print(f"✅ Respuesta corregida (problemas detectados: {len(correction_analysis.get('problemas', []))})")
                if correction_analysis.get('problemas'):
                    print(f"   Problemas: {', '.join(correction_analysis['problemas'][:3])}")
                return corrected_answer, usage_info
            else:
                print("✅ Respuesta aprobada (no necesita corrección)")
                return answer, usage_info
                
        except Exception as e:
            print(f"⚠️ Error en corrección, usando respuesta original: {e}")
            return answer, usage_info
    
    def generate_test(self, difficulty: str = "medium", num_questions: int = 10, topics: Optional[list[str]] = None, constraints: Optional[str] = None, model: Optional[str] = None, conversation_history: Optional[list[dict]] = None, user_id: Optional[str] = None, chat_id: Optional[str] = None, user_level: Optional[int] = None) -> tuple[dict, dict]:
        """
        Genera un test personalizado
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            num_questions: Número de preguntas
            topics: Temas específicos (opcional)
            constraints: Restricciones o condiciones específicas para las preguntas (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            conversation_history: Historial de conversación del chat (opcional)
            user_id: ID del usuario para obtener su nivel (opcional)
            chat_id: ID de la conversación para obtener el nivel (opcional)
            user_level: Nivel del usuario (0-10) si ya se obtuvo (opcional)
            
        Returns:
            Tupla con (test generado, información de tokens)
        """
        # Obtener nivel del usuario desde la conversación si hay chat_id y no se proporcionó user_level
        if user_level is None and user_id and chat_id:
            try:
                from progress_tracker import ProgressTracker
                tracker = ProgressTracker()
                chat_data = tracker.get_chat_level(user_id, chat_id)
                user_level = chat_data.get("level", 0)
                print(f"📊 Nivel del usuario en conversación '{chat_id}': {user_level}/10")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
                user_level = 0
        
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n📝 Generando test ({difficulty}, {num_questions} preguntas, nivel usuario: {user_level if user_level is not None else 'N/A'}/10) con modelo {model_str}...")
        test = self.test_generator.generate_test(difficulty, num_questions, topics, constraints=constraints, model=model, conversation_history=conversation_history, user_level=user_level)
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
    
    def generate_exercise(
        self,
        difficulty: str = "medium",
        topics: Optional[list[str]] = None,
        exercise_type: Optional[str] = None,
        constraints: Optional[str] = None,
        model: Optional[str] = None,
        conversation_history: Optional[list[dict]] = None,
        user_id: Optional[str] = None,
        user_level: Optional[int] = None,
        chat_id: Optional[str] = None
    ) -> tuple[dict, dict]:
        """
        Genera un ejercicio complejo
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            topics: Temas específicos (opcional)
            exercise_type: Tipo de ejercicio (opcional)
            constraints: Restricciones o condiciones específicas para el ejercicio (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            conversation_history: Historial de conversación reciente (opcional)
            user_id: ID del usuario para obtener su nivel (opcional)
            user_level: Nivel del usuario (opcional, si no se proporciona se obtiene automáticamente)
            
        Returns:
            Tupla con (ejercicio generado, información de tokens)
        """
        # Obtener nivel del usuario si hay user_id y topics
        if user_level is None and user_id and topics and len(topics) > 0:
            try:
                from progress_tracker import ProgressTracker
                tracker = ProgressTracker()
                main_topic = topics[0] if isinstance(topics, list) else str(topics)
                topic_data = tracker.get_topic_level(user_id, main_topic)
                user_level = topic_data.get("level", 0)
                print(f"📊 Nivel del usuario en '{main_topic}': {user_level}/10")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el nivel del usuario: {e}")
        
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n📝 Generando ejercicio ({difficulty}) con modelo {model_str}...")
        
        # Intentar generar el ejercicio hasta 3 veces si hay errores
        max_attempts = 3
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                result = self.exercise_generator.generate_exercise(
                    difficulty=difficulty,
                    topics=topics,
                    exercise_type=exercise_type,
                    constraints=constraints,
                    model=model,
                    conversation_history=conversation_history,
                    user_level=user_level,
                    chat_id=chat_id,
                    user_id=user_id
                )
                
                # El agente devuelve {"exercise": exercise_data, "exercise_id": ..., "usage_info": ...}
                # Extraer el ejercicio y la información de tokens
                if "error" in result:
                    last_error = result["error"]
                    if attempt < max_attempts - 1:
                        print(f"⚠️ Intento {attempt + 1} falló: {last_error}. Reintentando...")
                        continue
                    else:
                        # Último intento falló, intentar generar un ejercicio básico
                        print(f"⚠️ Todos los intentos fallaron. Generando ejercicio básico de respaldo...")
                        exercise_data = {
                            "exercise_id": result.get("exercise_id", "backup_exercise"),
                            "statement": f"Responde la siguiente pregunta sobre {', '.join(topics) if topics else 'el tema'}:",
                            "expected_answer": "Respuesta esperada",
                            "hints": ["Revisa el contenido estudiado", "Piensa paso a paso"],
                            "points": 10,
                            "difficulty": difficulty,
                            "topics": topics or [],
                            "solution_steps": ["Paso 1: Analiza la pregunta", "Paso 2: Identifica los conceptos clave", "Paso 3: Formula tu respuesta"]
                        }
                        usage_info = result.get("usage_info", {"inputTokens": 0, "outputTokens": 0})
                        print("✅ Ejercicio de respaldo generado")
                        return exercise_data, usage_info
                
                exercise_data = result.get("exercise", {})
                usage_info = result.get("usage_info", {"inputTokens": 0, "outputTokens": 0})
                
                # Asegurar que el ejercicio tenga todos los campos necesarios
                if not exercise_data:
                    if attempt < max_attempts - 1:
                        print(f"⚠️ Intento {attempt + 1}: ejercicio vacío. Reintentando...")
                        continue
                    else:
                        raise Exception("No se pudo generar el ejercicio después de múltiples intentos")
                
                # Validar campos mínimos
                if "statement" not in exercise_data:
                    exercise_data["statement"] = f"Responde la siguiente pregunta sobre {', '.join(topics) if topics else 'el tema'}:"
                if "expected_answer" not in exercise_data:
                    exercise_data["expected_answer"] = "Respuesta esperada"
                if "points" not in exercise_data:
                    exercise_data["points"] = 10
                if "hints" not in exercise_data:
                    exercise_data["hints"] = []
                if "solution_steps" not in exercise_data:
                    exercise_data["solution_steps"] = []
                
                print("✅ Ejercicio generado exitosamente")
                return exercise_data, usage_info
                
            except Exception as e:
                last_error = str(e)
                if attempt < max_attempts - 1:
                    print(f"⚠️ Intento {attempt + 1} falló con excepción: {last_error}. Reintentando...")
                    continue
                else:
                    # Último intento, generar ejercicio básico
                    print(f"⚠️ Todos los intentos fallaron. Generando ejercicio básico de respaldo...")
                    exercise_data = {
                        "exercise_id": f"backup_{attempt}",
                        "statement": f"Responde la siguiente pregunta sobre {', '.join(topics) if topics else 'el tema'}:",
                        "expected_answer": "Respuesta esperada",
                        "hints": ["Revisa el contenido estudiado", "Piensa paso a paso"],
                        "points": 10,
                        "difficulty": difficulty,
                        "topics": topics or [],
                        "solution_steps": ["Paso 1: Analiza la pregunta", "Paso 2: Identifica los conceptos clave", "Paso 3: Formula tu respuesta"]
                    }
                    usage_info = {"inputTokens": 0, "outputTokens": 0}
                    print("✅ Ejercicio de respaldo generado")
                    return exercise_data, usage_info
        
        # Si llegamos aquí, todos los intentos fallaron
        raise Exception(f"No se pudo generar el ejercicio después de {max_attempts} intentos: {last_error}")
    
    def correct_exercise(
        self,
        exercise: dict,
        student_answer: str,
        model: Optional[str] = None
    ) -> tuple[dict, dict]:
        """
        Corrige un ejercicio y proporciona feedback
        
        Args:
            exercise: Ejercicio con enunciado y respuesta esperada
            student_answer: Respuesta del estudiante
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            
        Returns:
            Tupla con (corrección con nota y feedback, información de tokens)
        """
        model_str = model if model else "automático (optimizando costes)"
        print(f"\n✏️ Corrigiendo ejercicio con modelo {model_str}...")
        result = self.exercise_corrector.correct_exercise(
            exercise=exercise,
            student_answer=student_answer,
            model=model
        )
        print("✅ Corrección completada")
        
        # El agente devuelve {"correction": correction_data, "exercise_id": ..., "points": ..., "usage_info": ...}
        # Extraer la corrección y la información de tokens
        if "error" in result:
            raise Exception(result["error"])
        
        correction_data = result.get("correction", {})
        usage_info = result.get("usage_info", {"inputTokens": 0, "outputTokens": 0})
        
        # Asegurar que la corrección tenga todos los campos necesarios
        if not correction_data:
            raise Exception("No se pudo corregir el ejercicio")
        
        return correction_data, usage_info


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
