"""
Exercise Generator Agent - Genera ejercicios complejos
Crea ejercicios con enunciados detallados que requieren respuestas largas, numéricas o complejas
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

from typing import Dict, Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager
import json
import uuid

class ExerciseGeneratorAgent:
    """
    Agente especializado en generar ejercicios complejos con respuestas abiertas
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente generador de ejercicios
        
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
                    temperature=0.8,
                    api_key=self.api_key
                )
                print("🤖 Exercise Generator Agent inicializado")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Exercise Generator Agent inicializado sin API key (se requerirá para usar)")
        
        self.generated_exercises: Dict[str, Dict] = {}  # Almacenar ejercicios generados
    
    def generate_exercise(
        self,
        difficulty: str = "medium",
        topics: Optional[List[str]] = None,
        exercise_type: Optional[str] = None,
        constraints: Optional[str] = None,
        model: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_level: Optional[int] = None,
        chat_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict:
        """
        Genera un ejercicio complejo
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            topics: Temas específicos (opcional)
            exercise_type: Tipo de ejercicio (matemático, programación, análisis, etc.)
            constraints: Restricciones o condiciones específicas para el ejercicio (opcional)
            model: Modelo de OpenAI a usar (opcional, usa modo automático si no se especifica)
            conversation_history: Historial de conversación reciente
            
        Returns:
            Ejercicio generado con enunciado y respuesta correcta esperada
        """
        # Verificar API key
        if not self.api_key:
            return {
                "error": "Se requiere configurar una API key de OpenAI para generar ejercicios.",
                "exercise_id": str(uuid.uuid4())[:8]
            }
        
        # Importar model_manager para selección automática
        from model_manager import ModelManager
        
        # Inicializar LLM con el modelo especificado o modo automático
        try:
            if model and model != "auto":
                # Usar modelo específico
                self.llm = ChatOpenAI(
                    model=model,
                    temperature=0.8,
                    api_key=self.api_key
                )
            else:
                # Modo automático: usar ModelManager para seleccionar el mejor modelo
                model_manager = ModelManager(api_key=self.api_key)
                selected_model = model_manager.select_model("exercise_generation")
                self.llm = model_manager.get_llm(selected_model)
                print(f"  - Modelo seleccionado automáticamente: {selected_model}")
        except Exception as e:
            # Fallback a gpt-4-turbo si el modelo especificado falla
            try:
                print(f"⚠️ Modelo {model} no disponible, usando gpt-4-turbo como fallback")
                self.llm = ChatOpenAI(
                    model="gpt-4-turbo",
                    temperature=0.8,
                    api_key=self.api_key
                )
            except Exception as e2:
                return {
                    "error": f"Error al inicializar el modelo: {str(e2)}",
                    "exercise_id": str(uuid.uuid4())[:8]
                }
        
        exercise_id = str(uuid.uuid4())[:8]
        
        # Construir contexto desde conversación o memoria
        context = ""
        if conversation_history:
            # Priorizar conversación reciente
            relevant_messages = [msg for msg in conversation_history if msg.get('role') in ['user', 'assistant']]
            if relevant_messages:
                # Usar los últimos 3 mensajes para enfocarse en el tema más reciente
                recent_messages = relevant_messages[-3:]
                conversation_text = "\n\n".join([
                    f"{'Usuario' if msg.get('role') == 'user' else 'Asistente'}: {msg.get('content', '')[:2000]}"
                    for msg in recent_messages
                ])
                context = f"Contexto de la conversación reciente:\n{conversation_text}\n\n"
                print(f"  - Usando {len(recent_messages)} mensajes recientes de la conversación")
        
        # Si no hay conversación suficiente, buscar en memoria (solo del chat actual)
        if not context or len(context) < 100:
            query = "conceptos principales del temario"
            if topics:
                query = " ".join(topics)
            relevant_content = self.memory.retrieve_relevant_content(query, n_results=5, chat_id=chat_id, user_id=user_id)
            if relevant_content:
                context += "\n\n".join(relevant_content[:3])
                print(f"  - Usando {len(relevant_content[:3])} fragmentos de memoria del chat {chat_id}")
        
        if not context:
            return {
                "error": "No hay contenido disponible para generar el ejercicio. Por favor, sube documentos primero o especifica un tema.",
                "exercise_id": exercise_id,
                "usage_info": {"inputTokens": 0, "outputTokens": 0}
            }
        
        # Ajustar dificultad basada en el nivel del usuario si no se especifica
        level_adjustment_note = ""
        if user_level is not None and topics:
            # Mapear nivel del usuario (0-10) a dificultad
            if user_level <= 3:
                adjusted_difficulty = "easy"
                level_adjustment_note = f"\n\n📊 NIVEL DEL USUARIO: {user_level}/10 (Principiante)\nEl usuario está en nivel {user_level}, por lo que el ejercicio debe ser básico y accesible. "
            elif user_level <= 6:
                adjusted_difficulty = "medium"
                level_adjustment_note = f"\n\n📊 NIVEL DEL USUARIO: {user_level}/10 (Intermedio)\nEl usuario está en nivel {user_level}, por lo que el ejercicio debe ser de nivel intermedio. "
            else:
                adjusted_difficulty = "hard"
                level_adjustment_note = f"\n\n📊 NIVEL DEL USUARIO: {user_level}/10 (Avanzado)\nEl usuario está en nivel {user_level}, por lo que el ejercicio puede ser más desafiante y complejo. "
            
            # Si la dificultad solicitada es diferente, usar la ajustada pero mencionar ambas
            if difficulty != adjusted_difficulty:
                level_adjustment_note += f"Se ajusta la dificultad solicitada '{difficulty}' a '{adjusted_difficulty}' según el nivel del usuario. "
                difficulty = adjusted_difficulty
            else:
                level_adjustment_note += f"La dificultad '{difficulty}' es apropiada para el nivel del usuario. "
        
        # Definir niveles de dificultad
        difficulty_instructions = {
            "easy": "Ejercicio básico que evalúa comprensión fundamental. Requiere aplicación directa de conceptos. Ideal para principiantes.",
            "medium": "Ejercicio intermedio que requiere comprensión y aplicación de conceptos. Puede combinar varios conceptos. Nivel intermedio.",
            "hard": "Ejercicio avanzado que requiere análisis profundo, síntesis de múltiples conceptos y pensamiento crítico. Nivel avanzado."
        }
        
        topics_str = ", ".join(topics) if topics else "General"
        topics_list = topics if topics else []
        
        print(f"[ExerciseGenerator] Topics recibidos: {topics}")
        print(f"[ExerciseGenerator] Topics string: {topics_str}")
        print(f"[ExerciseGenerator] Topics list: {topics_list}")
        
        # Construir instrucción de constraints si están presentes (ANTES del prompt)
        constraints_instruction = ""
        if constraints:
            constraints_instruction = f"""
RESTRICCIONES Y CONDICIONES OBLIGATORIAS:
{constraints}

⚠️ CRÍTICO: DEBES RESPETAR ABSOLUTAMENTE estas restricciones en el ejercicio generado.
- Si se especifican condiciones sobre el formato, estructura o contenido, DEBES seguirlas estrictamente.
- NO ignores estas restricciones bajo ninguna circunstancia.
- El ejercicio debe cumplir con todas las restricciones especificadas.
"""
        
        # Detectar si es un tema de programación
        is_programming = False
        programming_language = None
        if topics:
            topics_lower = topics_str.lower()
            programming_keywords = ["python", "javascript", "java", "sql", "c++", "c#", "programación", "programming", "código", "code"]
            for keyword in programming_keywords:
                if keyword in topics_lower:
                    is_programming = True
                    if "python" in topics_lower:
                        programming_language = "Python"
                    elif "javascript" in topics_lower or "js" in topics_lower:
                        programming_language = "JavaScript"
                    elif "java" in topics_lower:
                        programming_language = "Java"
                    elif "sql" in topics_lower:
                        programming_language = "SQL"
                    break
        
        # Instrucciones especiales para programación
        programming_instruction = ""
        if is_programming and programming_language:
            programming_instruction = f"""
🚨🚨🚨 CRÍTICO - EJERCICIO DE PROGRAMACIÓN EN {programming_language} 🚨🚨🚨

Este ejercicio DEBE ser de programación práctica y ejecutable en {programming_language}.

REQUISITOS OBLIGATORIOS:
1. El ejercicio DEBE requerir escribir código ejecutable en {programming_language}
2. El enunciado debe pedir al estudiante que escriba un programa o función específica
3. La respuesta esperada (expected_answer) DEBE incluir:
   - El código completo y funcional entre bloques ```{programming_language.lower()}
   - La salida esperada en el formato: "Salida esperada:\\n[output exacto]"
   - NO explicaciones textuales, SOLO código y salida
4. El ejercicio debe ser práctico y ejecutable, NO teórico
5. El nivel de dificultad debe adecuarse al nivel del usuario ({user_level}/10 si está disponible)

EJEMPLOS DE BUENOS EJERCICIOS:
- Escribir una función que calcule X y devuelva Y
- Crear un programa que procese datos de entrada y muestre resultados
- Implementar un algoritmo específico con entrada/salida

PROHIBIDO:
- NO generar ejercicios sobre diseño de sistemas, arquitectura, o conceptos abstractos
- NO generar ejercicios que no requieran código ejecutable
- NO incluir solo explicaciones en expected_answer, DEBE incluir código

El ejercicio debe poder ejecutarse y producir una salida verificable.
"""
        
        # Construir instrucción adicional para programación
        programming_expected_answer_instruction = ""
        if is_programming and programming_language:
            programming_expected_answer_instruction = f"""

🚨🚨🚨 CRÍTICO - FORMATO OBLIGATORIO PARA expected_answer EN EJERCICIOS DE {programming_language} 🚨🚨🚨

La respuesta esperada (expected_answer) DEBE ser EXACTAMENTE así (NO una explicación textual):

```{programming_language.lower()}
[EL CÓDIGO COMPLETO Y FUNCIONAL AQUÍ]
```

Salida esperada:
[LA SALIDA EXACTA QUE PRODUCE EL CÓDIGO]

EJEMPLO COMPLETO DE expected_answer CORRECTO:
```python
texto = input("Ingrese un texto: ")
palabras = texto.split()
numero_palabras = len(palabras)
print(f"El texto tiene {{numero_palabras}} palabra(s)")
```

Salida esperada:
Ingrese un texto: Hola mundo
El texto tiene 2 palabra(s)

⚠️ PROHIBIDO:
- NO escribas explicaciones como "La respuesta es correcta porque..."
- NO escribas solo texto descriptivo
- NO omitas el código
- NO omitas la salida esperada

✅ OBLIGATORIO:
- DEBE empezar con ```{programming_language.lower()}
- DEBE incluir el código completo y ejecutable
- DEBE terminar con ```
- DEBE incluir "Salida esperada:" seguido de la salida exacta

Si no sigues este formato EXACTO, el ejercicio será inválido.
"""
        
        # Construir el ejemplo de JSON como cadena separada para evitar conflictos con el formateo
        expected_answer_example = f'Código completo entre ```{programming_language.lower()} y ``` seguido de "Salida esperada: [output]"' if is_programming and programming_language else 'Respuesta correcta esperada (puede ser larga, numérica, código, etc.)'
        topics_list_json = json.dumps(topics_list)
        
        # Construir el JSON de ejemplo como cadena
        # Escapar las comillas dobles en expected_answer_example para que no rompan el JSON
        expected_answer_escaped = expected_answer_example.replace('"', '\\"')
        
        # Construir el JSON de ejemplo como cadena literal para evitar conflictos con el formateo
        # IMPORTANTE: Cuando se inserte en el prompt, todas las llaves deben estar doblemente escapadas
        # para que se conviertan en llaves literales en el template de LangChain
        # Ejemplo mejorado con statement completo y pistas específicas
        example_statement = "Escribe una función en Python que reciba una lista de números enteros y devuelva una nueva lista con solo los números pares. La función debe llamarse 'filtrar_pares' y debe manejar listas vacías correctamente."
        example_hints = [
            "Recuerda que un número es par si el resto de dividirlo entre 2 es 0 (usa el operador %)",
            "Puedes usar una lista por comprensión o un bucle for con append()",
            "No olvides probar tu función con una lista vacía para verificar que funciona correctamente"
        ]
        example_hints_json = json.dumps(example_hints)
        
        json_example = (
            "{{\n"
            f'    "exercise_id": "{exercise_id}",\n'
            f'    "statement": "{example_statement}",\n'
            f'    "expected_answer": "{expected_answer_escaped}",\n'
            f'    "hints": {example_hints_json},\n'
            '    "points": 10,\n'
            '    "difficulty": "{{{{difficulty}}}}",\n'  # 4 llaves para que quede {{difficulty}} en el template
            f'    "topics": {topics_list_json},\n'
            '    "solution_steps": ["Paso 1 de la solución", "Paso 2", "Paso 3"]\n'
            "}}"
        )
        
        # Construir prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""Eres un experto educador que crea ejercicios complejos y desafiantes para estudiantes.
{level_adjustment_note}
{programming_instruction}
Tu tarea es generar un ejercicio que:
1. Tenga un enunciado claro y detallado
2. Requiera una respuesta que puede ser:
   - Una respuesta larga y explicativa
   - Un valor numérico con cálculos
   - Un código o solución técnica
   - Un análisis o razonamiento
   - Cualquier tipo de respuesta compleja (NO opción múltiple)

El ejercicio debe ser educativo, desafiante pero alcanzable, y debe evaluar comprensión real del tema.
El ejercicio DEBE estar relacionado con los temas especificados: {topics_str}.

IMPORTANTE: 
- El ejercicio NO debe ser de opción múltiple. Debe requerir que el estudiante escriba su propia respuesta.
- El ejercicio DEBE estar directamente relacionado con el tema de la conversación: {topics_str}
- NO generes ejercicios sobre temas no relacionados con el tema especificado.
- Si el tema es de programación, el ejercicio DEBE ser de código ejecutable."""),
            ("human", ("Genera un ejercicio {difficulty} sobre el siguiente contenido:\n\n"
                      "{context}\n\n"
                      "Temas específicos: {topics}\n"
                      "Tipo de ejercicio sugerido: {exercise_type}\n"
                      "{constraints_instruction}\n\n"
                      "Instrucciones de dificultad: {difficulty_instruction}\n\n"
                      "Genera el ejercicio en formato JSON con la siguiente estructura (ejemplo):\n"
                      "{json_example}\n"
                      "{programming_expected_answer_instruction}\n"
                      "\n"
                      "🚨 CRÍTICO - FORMATO DEL ENUNCIADO (statement):\n"
                      "- El statement DEBE incluir la pregunta o tarea COMPLETA, NO solo 'Responde la siguiente pregunta sobre X:'\n"
                      "- El statement DEBE ser específico y detallado, con toda la información necesaria para resolver el ejercicio\n"
                      "- EJEMPLO MALO: 'Responde la siguiente pregunta sobre Python:' (esto NO es válido)\n"
                      "- EJEMPLO BUENO: 'Escribe una función en Python que reciba una lista de números y devuelva la suma de todos los elementos. La función debe llamarse sumar_lista y manejar listas vacías.'\n"
                      "- Si es de programación, el statement DEBE especificar qué código escribir, qué función crear, qué problema resolver\n"
                      "- Si es teórico, el statement DEBE incluir la pregunta completa con contexto\n"
                      "\n"
                      "🚨 CRÍTICO - FORMATO DE LAS PISTAS (hints):\n"
                      "- Las pistas DEBEN ser específicas y útiles, NO genéricas como 'Revisa el contenido estudiado' o 'Piensa paso a paso'\n"
                      "- Cada pista DEBE dar una orientación concreta sobre cómo resolver el ejercicio\n"
                      "- EJEMPLO MALO: ['Revisa el contenido estudiado', 'Piensa paso a paso'] (esto NO es útil)\n"
                      "- EJEMPLO BUENO: ['Recuerda que en Python puedes usar el operador % para obtener el resto de una división', 'Puedes usar una lista por comprensión para filtrar elementos', 'No olvides manejar el caso de listas vacías']\n"
                      "- Las pistas DEBEN estar relacionadas directamente con el ejercicio específico, no ser consejos generales\n"
                      "\n"
                      "El enunciado debe ser claro, completo y proporcionar toda la información necesaria.\n"
                      "La respuesta esperada debe ser detallada y servir como referencia para la corrección.\n"
                      "Los pasos de solución deben mostrar cómo resolver el ejercicio paso a paso.\n\n"
                      "Responde SOLO con el JSON, sin texto adicional antes o después.").format(
                constraints_instruction=constraints_instruction,
                json_example=json_example,
                programming_expected_answer_instruction=programming_expected_answer_instruction
            ))
        ])
        
        try:
            messages = prompt.format_messages(
                difficulty=difficulty,
                context=context[:5000],  # Limitar contexto
                topics=topics_str,
                exercise_type=exercise_type or "General",
                constraints_instruction=constraints_instruction,
                difficulty_instruction=difficulty_instructions.get(difficulty, difficulty_instructions["medium"])
            )
            
            print(f"\n📝 Generando ejercicio {difficulty}...")
            print(f"   Temas: {topics_str}")
            print(f"   Tipo: {exercise_type or 'General'}")
            
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
                exercise_data = json.loads(json_match)
            except json.JSONDecodeError:
                # Si falla, intentar extraer campos manualmente
                print("⚠️ No se pudo parsear JSON, intentando extracción manual...")
                exercise_data = {
                    "exercise_id": exercise_id,
                    "statement": response_text.split('"statement":')[1].split('"')[1] if '"statement":' in response_text else "Ejercicio generado",
                    "expected_answer": response_text.split('"expected_answer":')[1].split('"')[1] if '"expected_answer":' in response_text else "Respuesta esperada",
                    "hints": [],
                    "points": 10,
                    "difficulty": difficulty,
                    "topics": topics_list,
                    "solution_steps": []
                }
            
            # Validar estructura
            if "statement" not in exercise_data:
                exercise_data["statement"] = "Ejercicio generado"
            if "expected_answer" not in exercise_data:
                exercise_data["expected_answer"] = "Respuesta esperada"
            if "hints" not in exercise_data:
                exercise_data["hints"] = []
            if "points" not in exercise_data:
                exercise_data["points"] = 10
            if "solution_steps" not in exercise_data:
                exercise_data["solution_steps"] = []
            
            exercise_data["exercise_id"] = exercise_id
            exercise_data["difficulty"] = difficulty
            exercise_data["topics"] = topics_list
            
            # Guardar ejercicio generado
            self.generated_exercises[exercise_id] = exercise_data
            
            print(f"✅ Ejercicio generado: {exercise_id}")
            
            return {
                "exercise": exercise_data,
                "exercise_id": exercise_id,
                "usage_info": usage_info
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error al generar ejercicio: {error_msg}")
            import traceback
            traceback.print_exc()
            return {
                "error": f"Error al generar ejercicio: {error_msg}",
                "exercise_id": exercise_id,
                "usage_info": {"inputTokens": 0, "outputTokens": 0}
            }

