"""
Exercise Corrector Agent - Corrige ejercicios y proporciona feedback detallado
Evalúa respuestas de estudiantes y asigna notas con explicaciones
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

from typing import Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager
import json

class ExerciseCorrectorAgent:
    """
    Agente especializado en corregir ejercicios y proporcionar feedback educativo
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente corrector de ejercicios
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        self.llm = None  # Se inicializará cuando se necesite
        
        if self.api_key:
            try:
                self.llm = ChatOpenAI(
                    model="gpt-4",
                    temperature=0.3,  # Más determinista para corrección
                    api_key=self.api_key
                )
                print("🤖 Exercise Corrector Agent inicializado")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Exercise Corrector Agent inicializado sin API key (se requerirá para usar)")
    
    def correct_exercise(
        self,
        exercise: Dict,
        student_answer: str,
        model: Optional[str] = None
    ) -> Dict:
        """
        Corrige un ejercicio y proporciona feedback detallado
        
        Args:
            exercise: Ejercicio con enunciado y respuesta esperada
            student_answer: Respuesta del estudiante
            model: Modelo de OpenAI a usar (opcional, usa modo automático si no se especifica)
            
        Returns:
            Corrección con nota, feedback y explicación
        """
        # Verificar API key
        if not self.api_key:
            return {
                "error": "Se requiere configurar una API key de OpenAI para corregir ejercicios.",
                "score": 0
            }
        
        # Importar model_manager para selección automática
        from model_manager import ModelManager
        
        # Inicializar LLM con el modelo especificado o modo automático
        try:
            if model and model != "auto":
                # Usar modelo específico
                self.llm = ChatOpenAI(
                    model=model,
                    temperature=0.3,  # Más determinista para corrección
                    api_key=self.api_key
                )
            else:
                # Modo automático: usar ModelManager para seleccionar el mejor modelo
                model_manager = ModelManager(api_key=self.api_key)
                selected_model = model_manager.select_model("exercise_correction")
                self.llm = model_manager.get_llm(selected_model)
                print(f"  - Modelo seleccionado automáticamente: {selected_model}")
        except Exception as e:
            # Fallback a gpt-4-turbo si el modelo especificado falla
            try:
                print(f"⚠️ Modelo {model} no disponible, usando gpt-4-turbo como fallback")
                self.llm = ChatOpenAI(
                    model="gpt-4-turbo",
                    temperature=0.3,
                    api_key=self.api_key
                )
            except Exception as e2:
                return {
                    "error": f"Error al inicializar el modelo: {str(e2)}",
                    "score": 0,
                    "score_percentage": 0.0
                }
        
        # Construir prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Eres un profesor experto que corrige ejercicios de estudiantes de manera justa y educativa.

Tu tarea es:
1. Evaluar la respuesta del estudiante comparándola con la respuesta esperada
2. Asignar una nota de 0 a 10 (puede tener decimales)
3. Proporcionar feedback constructivo y detallado
4. Explicar qué está bien y qué necesita mejorar
5. Dar sugerencias para mejorar

IMPORTANTE SOBRE IMÁGENES:
- Si el estudiante envía su respuesta como imagen, esto es PERFECTAMENTE VÁLIDO y NO es una debilidad
- Las imágenes son un formato aceptable para respuestas, especialmente para diagramas, código, o soluciones escritas a mano
- NO menciones el uso de imagen como debilidad o problema
- Si hay una imagen, evalúa el contenido visible en ella (código, texto, diagramas, etc.)
- Si no puedes ver claramente el contenido de la imagen, menciona esto de manera neutral, pero NO como debilidad del estudiante

Sé justo pero riguroso. Reconoce respuestas parcialmente correctas y da crédito donde corresponda.
La nota debe reflejar la calidad y completitud de la respuesta."""),
            ("human", """Corrige el siguiente ejercicio:

ENUNCIADO:
{statement}

RESPUESTA ESPERADA:
{expected_answer}

PASOS DE SOLUCIÓN:
{solution_steps}

RESPUESTA DEL ESTUDIANTE:
{student_answer}

PUNTOS TOTALES: {points}

Evalúa la respuesta del estudiante y genera una corrección en formato JSON con la siguiente estructura:
{{
    "score": 8.5,
    "score_percentage": 85.0,
    "is_correct": false,
    "feedback": "Feedback detallado sobre la respuesta. Explica qué está bien, qué está mal, y qué falta.",
    "strengths": ["Aspecto positivo 1", "Aspecto positivo 2"],
    "weaknesses": ["Aspecto a mejorar 1", "Aspecto a mejorar 2"],
    "suggestions": ["Sugerencia 1 para mejorar", "Sugerencia 2"],
    "detailed_analysis": "Análisis detallado punto por punto de la respuesta del estudiante comparada con la esperada.",
    "correct_answer_explanation": "Explicación de por qué la respuesta esperada es correcta."
}}

IMPORTANTE:
- La nota (score) debe ser un número entre 0 y {points} (puede tener decimales)
- score_percentage debe ser (score / {points}) * 100
- is_correct debe ser true solo si la respuesta es completamente correcta o muy cercana
- El feedback debe ser constructivo y educativo
- Las fortalezas y debilidades deben ser específicas
- Las sugerencias deben ser accionables

Responde SOLO con el JSON, sin texto adicional antes o después.""")
        ])
        
        # Asegurar que todos los valores sean del tipo correcto
        statement = str(exercise.get("statement", "")) if exercise.get("statement") else ""
        expected_answer = str(exercise.get("expected_answer", "")) if exercise.get("expected_answer") else ""
        solution_steps = exercise.get("solution_steps", [])
        if not isinstance(solution_steps, list):
            solution_steps = [str(solution_steps)] if solution_steps else []
        points = exercise.get("points", 10)
        try:
            points = float(points)
        except (ValueError, TypeError):
            points = 10.0
        
        # Asegurar que student_answer sea un string
        if not isinstance(student_answer, str):
            if isinstance(student_answer, list):
                student_answer = "\n".join(str(item) for item in student_answer)
            else:
                student_answer = str(student_answer) if student_answer else ""
        
        try:
            messages = prompt.format_messages(
                statement=statement,
                expected_answer=expected_answer,
                solution_steps="\n".join([f"{i+1}. {step}" for i, step in enumerate(solution_steps)]) if solution_steps else "No hay pasos de solución proporcionados.",
                student_answer=student_answer,
                points=points
            )
            
            print(f"\n📝 Corrigiendo ejercicio...")
            print(f"   Puntos totales: {points}")
            
            response = self.llm.invoke(messages)
            response_text = response.content.strip()
            
            # Capturar información de tokens
            usage_info = {
                "inputTokens": 0,
                "outputTokens": 0
            }
            
            # Intentar obtener tokens de la metadata de la respuesta
            if hasattr(response, 'response_metadata') and response.response_metadata:
                token_usage = response.response_metadata.get('token_usage', {})
                usage_info["inputTokens"] = token_usage.get('prompt_tokens', 0)
                usage_info["outputTokens"] = token_usage.get('completion_tokens', 0)
            elif hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage_info["inputTokens"] = response.usage_metadata.get('input_tokens', 0)
                usage_info["outputTokens"] = response.usage_metadata.get('output_tokens', 0)
            
            # Asegurar que response_text sea un string
            if not isinstance(response_text, str):
                response_text = str(response_text) if response_text else ""
            
            # Intentar extraer JSON de la respuesta
            json_match = None
            if "```json" in response_text:
                json_match = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_match = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_match = response_text
            
            # Intentar parsear JSON
            try:
                correction_data = json.loads(json_match)
            except json.JSONDecodeError:
                # Si falla, crear estructura básica
                print("⚠️ No se pudo parsear JSON, creando estructura básica...")
                correction_data = {
                    "score": 5.0,
                    "score_percentage": 50.0,
                    "is_correct": False,
                    "feedback": "No se pudo analizar la respuesta completamente. Por favor, revisa tu respuesta.",
                    "strengths": [],
                    "weaknesses": ["No se pudo evaluar completamente"],
                    "suggestions": ["Revisa la respuesta esperada y compara con tu respuesta"],
                    "detailed_analysis": response_text[:500],
                    "correct_answer_explanation": expected_answer[:500]
                }
            
            # Validar y normalizar estructura
            if "score" not in correction_data:
                correction_data["score"] = 0.0
            if "score_percentage" not in correction_data:
                correction_data["score_percentage"] = (correction_data["score"] / points) * 100
            if "is_correct" not in correction_data:
                correction_data["is_correct"] = correction_data.get("score", 0) >= points * 0.9
            if "feedback" not in correction_data:
                correction_data["feedback"] = "Feedback no disponible"
            if "strengths" not in correction_data:
                correction_data["strengths"] = []
            if "weaknesses" not in correction_data:
                correction_data["weaknesses"] = []
            if "suggestions" not in correction_data:
                correction_data["suggestions"] = []
            if "detailed_analysis" not in correction_data:
                correction_data["detailed_analysis"] = correction_data.get("feedback", "")
            if "correct_answer_explanation" not in correction_data:
                correction_data["correct_answer_explanation"] = expected_answer
            
            # Asegurar que score esté en el rango correcto
            correction_data["score"] = max(0.0, min(float(correction_data["score"]), float(points)))
            correction_data["score_percentage"] = (correction_data["score"] / points) * 100
            
            print(f"✅ Corrección completada: {correction_data['score']:.1f}/{points} ({correction_data['score_percentage']:.1f}%)")
            
            return {
                "correction": correction_data,
                "exercise_id": exercise.get("exercise_id", ""),
                "points": points,
                "usage_info": usage_info
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error al corregir ejercicio: {error_msg}")
            import traceback
            traceback.print_exc()
            return {
                "error": f"Error al corregir ejercicio: {error_msg}",
                "score": 0,
                "score_percentage": 0.0
            }

