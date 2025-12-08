"""
Feedback Agent - Corrige tests y proporciona feedback detallado
Analiza respuestas y da retroalimentación educativa
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

from typing import Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager

class FeedbackAgent:
    """
    Agente especializado en corregir respuestas y proporcionar feedback
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None):
        """
        Inicializa el agente de feedback
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
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
                print("🤖 Feedback Agent inicializado")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Feedback Agent inicializado sin API key (se requerirá para usar)")
    
    def grade_test(self, test_id: str, answers: Dict[str, str], test_data: Optional[Dict] = None) -> Dict:
        """
        Corrige un test y proporciona feedback detallado
        
        Args:
            test_id: ID del test
            answers: Diccionario con las respuestas del estudiante
                     Formato: {"q1": "A", "q2": "True", ...}
            test_data: Datos del test (opcional, se puede obtener del test_generator)
            
        Returns:
            Feedback detallado con correcciones
        """
        if test_data is None:
            return {
                "error": "No se proporcionó información del test para corregir.",
                "test_id": test_id
            }
        
        # Construir feedback para cada pregunta
        feedback_items = []
        correct_count = 0
        total_questions = len(answers)
        
        questions_dict = {q.get("id", ""): q for q in test_data.get("questions", [])}
        
        # Corregir cada pregunta
        for question_id, student_answer in answers.items():
            question = questions_dict.get(question_id, {})
            
            if not question:
                continue
            
            correct_answer = question.get("correct_answer", "").strip()
            question_text = question.get("question", f"Pregunta {question_id}")
            question_type = question.get("type", "multiple_choice")
            options = question.get("options", [])
            
            # Normalizar respuestas
            student_answer_normalized = str(student_answer).strip().upper()
            correct_answer_normalized = str(correct_answer).strip().upper()
            
            # Determinar si es correcta
            is_correct = student_answer_normalized == correct_answer_normalized
            
            if is_correct:
                correct_count += 1
            
            # Generar feedback detallado usando LLM
            feedback_text = self._generate_feedback(
                question_text,
                student_answer,
                correct_answer,
                question_type,
                options,
                is_correct,
                question.get("explanation", "")
            )
            
            feedback_items.append({
                "question_id": question_id,
                "question": question_text,
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "feedback": feedback_text,
                "explanation": question.get("explanation", "")
            })
        
        score = correct_count / total_questions if total_questions > 0 else 0
        
        # Generar feedback general
        general_feedback, general_feedback_usage = self._generate_general_feedback(score, feedback_items, total_questions, correct_count)
        
        # Acumular tokens de todas las llamadas al LLM
        total_input_tokens = sum(item.get("inputTokens", 0) for item in feedback_items if isinstance(item, dict) and "inputTokens" in item)
        total_output_tokens = sum(item.get("outputTokens", 0) for item in feedback_items if isinstance(item, dict) and "outputTokens" in item)
        
        # Añadir tokens del feedback general
        total_input_tokens += general_feedback_usage.get("inputTokens", 0)
        total_output_tokens += general_feedback_usage.get("outputTokens", 0)
        
        return {
            "test_id": test_id,
            "score": round(score, 2),
            "percentage": round(score * 100, 1),
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "question_feedback": feedback_items,
            "general_feedback": general_feedback,
            "recommendations": self._generate_recommendations(score, feedback_items),
            "usage_info": {
                "inputTokens": total_input_tokens,
                "outputTokens": total_output_tokens
            }
        }
    
    def _generate_feedback(self, question: str, student_answer: str, correct_answer: str,
                          question_type: str, options: List[str], is_correct: bool,
                          explanation: str) -> tuple[str, dict]:
        """
        Genera feedback para una pregunta específica
        """
        if is_correct:
            feedback_prompt = f"""El estudiante respondió correctamente a esta pregunta:

Pregunta: {question}
Respuesta correcta: {correct_answer}
Respuesta del estudiante: {student_answer}

Proporciona un feedback positivo y breve confirmando que la respuesta es correcta.
Si hay una explicación proporcionada, inclúyela: {explanation}"""
        else:
            options_text = "\n".join([f"- {opt}" for opt in options]) if options else ""
            feedback_prompt = f"""El estudiante respondió incorrectamente a esta pregunta:

Pregunta: {question}
Opciones disponibles:
{options_text}
Respuesta correcta: {correct_answer}
Respuesta del estudiante: {student_answer}
Explicación proporcionada: {explanation}

Proporciona:
1. Feedback constructivo
2. Por qué la respuesta correcta es correcta
3. Explicación clara del concepto
4. Una sugerencia para mejorar"""
        
        try:
            response = self.llm.invoke(feedback_prompt)
            
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
            
            return response.content, usage_info
        except Exception as e:
            error_msg = f"✅ Correcto. {explanation if explanation else 'Bien hecho!'}" if is_correct else f"❌ Incorrecto. La respuesta correcta es {correct_answer}. {explanation if explanation else 'Revisa este concepto.'}"
            return error_msg, {"inputTokens": 0, "outputTokens": 0}
    
    def _generate_general_feedback(self, score: float, feedback_items: List[Dict],
                                   total_questions: int, correct_count: int) -> tuple[str, dict]:
        """
        Genera feedback general sobre el rendimiento
        """
        percentage = score * 100
        
        if percentage >= 90:
            level = "excelente"
            message = f"¡Excelente trabajo! Has demostrado una comprensión sólida del tema con {correct_count}/{total_questions} respuestas correctas ({percentage:.1f}%)."
        elif percentage >= 70:
            level = "bueno"
            message = f"Buen trabajo. Has demostrado una buena comprensión con {correct_count}/{total_questions} respuestas correctas ({percentage:.1f}%). Hay algunas áreas para mejorar."
        elif percentage >= 50:
            level = "regular"
            message = f"Has respondido correctamente {correct_count}/{total_questions} preguntas ({percentage:.1f}%). Necesitas repasar algunos conceptos clave."
        else:
            level = "necesita_mejora"
            message = f"Has respondido correctamente {correct_count}/{total_questions} preguntas ({percentage:.1f}%). Te recomiendo revisar el material y hacer más preguntas antes de intentar otro test."
        
        # Analizar áreas de mejora
        incorrect_items = [item for item in feedback_items if not item.get("is_correct", False)]
        if incorrect_items:
            message += f"\n\nTemas a repasar: {len(incorrect_items)} áreas donde tuviste dificultades."
        
        # Por ahora, el feedback general no usa LLM, así que no hay tokens
        return message, {"inputTokens": 0, "outputTokens": 0}
    
    def _generate_recommendations(self, score: float, feedback_items: List[Dict]) -> List[str]:
        """
        Genera recomendaciones basadas en el rendimiento
        """
        recommendations = []
        
        incorrect_items = [item for item in feedback_items if not item["is_correct"]]
        
        if incorrect_items:
            recommendations.append(f"Revisa {len(incorrect_items)} conceptos donde tuviste dificultades.")
            recommendations.append("Solicita explicaciones adicionales sobre estos temas usando el chat.")
        
        if score < 0.6:
            recommendations.append("Te recomiendo repasar el contenido antes de hacer otro test.")
            recommendations.append("Haz preguntas sobre los conceptos que no entiendes completamente.")
        elif score >= 0.8:
            recommendations.append("¡Estás listo para un test de mayor dificultad!")
            recommendations.append("Puedes explorar conceptos más avanzados del tema.")
        else:
            recommendations.append("Continúa practicando para mejorar tu comprensión.")
        
        return recommendations
    
    def provide_detailed_explanation(self, concept: str) -> str:
        """
        Proporciona una explicación detallada de un concepto
        
        Args:
            concept: Concepto a explicar
            
        Returns:
            Explicación detallada
        """
        # Verificar API key
        if not self.api_key:
            return "⚠️ Se requiere configurar una API key de OpenAI para proporcionar explicaciones detalladas."
        
        # Inicializar LLM si no está inicializado
        if not self.llm:
            try:
                self.llm = ChatOpenAI(
                    model="gpt-4",
                    temperature=0.7,
                    api_key=self.api_key
                )
            except Exception as e:
                return f"⚠️ Error al inicializar el modelo: {str(e)}"
        
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=3)
        
        prompt = f"""Proporciona una explicación detallada y educativa del concepto '{concept}':

CONTENIDO DEL TEMARIO:
{chr(10).join(relevant_content) if relevant_content else 'Concepto del temario'}

Incluye:
- Definición clara
- Ejemplos prácticos
- Relación con otros conceptos
- Errores comunes a evitar
- Cómo aplicarlo en la práctica"""

        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            return f"Error al generar explicación: {str(e)}"
