"""
Test Generator Agent - Genera tests personalizados
Crea preguntas de opción múltiple, verdadero/falso y respuesta corta
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

from typing import List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.memory_manager import MemoryManager
import json
import uuid
import re
from fractions import Fraction

class TestGeneratorAgent:
    """
    Agente especializado en generar tests y ejercicios interactivos
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None):
        """
        Inicializa el agente generador de tests
        
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
                    temperature=0.8,
                    api_key=self.api_key
                )
                print("🤖 Test Generator Agent inicializado")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
        else:
            print("⚠️ Test Generator Agent inicializado sin API key (se requerirá para usar)")
        
        self.generated_tests: Dict[str, Dict] = {}  # Almacenar tests generados
    
    def _evaluate_math_expression(self, expr: str) -> Optional[float]:
        """
        Evalúa una expresión matemática simple y devuelve su valor numérico.
        Maneja fracciones, números decimales y operaciones básicas.
        """
        try:
            # Limpiar la expresión
            expr = expr.strip()
            
            # Intentar evaluar como fracción (ej: "2/3", "4/6")
            if '/' in expr:
                try:
                    parts = expr.split('/')
                    if len(parts) == 2:
                        num = float(parts[0].strip())
                        den = float(parts[1].strip())
                        if den != 0:
                            return num / den
                except:
                    pass
            
            # Intentar evaluar directamente
            try:
                result = float(expr)
                return result
            except:
                pass
            
            # Intentar evaluar expresiones simples como "3+3", "5-2", etc.
            # Solo para casos muy simples por seguridad
            if re.match(r'^[\d\+\-\*\/\(\)\.\s]+$', expr):
                try:
                    # Usar eval con precaución (solo números y operadores básicos)
                    result = eval(expr.replace(' ', ''))
                    return float(result)
                except:
                    pass
            
            return None
        except:
            return None
    
    def _are_math_equivalent(self, expr1: str, expr2: str) -> bool:
        """
        Determina si dos expresiones matemáticas son equivalentes.
        """
        # Normalizar expresiones
        expr1 = expr1.strip()
        expr2 = expr2.strip()
        
        # Si son idénticas, son equivalentes
        if expr1 == expr2:
            return True
        
        # Evaluar ambas expresiones
        val1 = self._evaluate_math_expression(expr1)
        val2 = self._evaluate_math_expression(expr2)
        
        if val1 is not None and val2 is not None:
            # Comparar con tolerancia para números de punto flotante
            return abs(val1 - val2) < 1e-10
        
        # Si no se pueden evaluar, comparar como fracciones simplificadas
        try:
            # Intentar convertir a fracciones
            if '/' in expr1 and '/' in expr2:
                frac1 = Fraction(expr1)
                frac2 = Fraction(expr2)
                return frac1 == frac2
        except:
            pass
        
        return False
    
    def generate_test(self, difficulty: str = "medium", num_questions: int = 10, topics: Optional[List[str]] = None, constraints: Optional[str] = None, model: Optional[str] = "gpt-4-turbo") -> Dict:
        """
        Genera un test personalizado
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            num_questions: Número de preguntas
            topics: Temas específicos (opcional)
            model: Modelo de OpenAI a usar (opcional, por defecto gpt-4-turbo)
            
        Returns:
            Test generado con preguntas y respuestas correctas
        """
        # Verificar API key
        if not self.api_key:
            return {
                "error": "Se requiere configurar una API key de OpenAI para generar tests. Por favor, configura tu API key.",
                "test_id": str(uuid.uuid4())[:8]
            }
        
        # Inicializar LLM con el modelo especificado
        try:
            self.llm = ChatOpenAI(
                model=model,
                temperature=0.8,
                api_key=self.api_key
            )
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
                    "test_id": str(uuid.uuid4())[:8]
                }
        
        test_id = str(uuid.uuid4())[:8]
        
        # Si hay temas específicos, usarlos directamente; si no, buscar en memoria
        context = ""
        use_specific_topic = False
        
        if topics and len(topics) > 0:
            # Si hay temas específicos, usarlos directamente sin buscar en memoria
            use_specific_topic = True
            context = f"Tema específico solicitado: {', '.join(topics)}"
        else:
            # Recuperar contenido relevante de la memoria
            query = "conceptos principales del temario"
            relevant_content = self.memory.retrieve_relevant_content(query, n_results=10)
            
            if not relevant_content:
                return {
                    "error": "No hay contenido disponible para generar el test. Por favor, sube documentos primero o especifica un tema para el test.",
                    "test_id": test_id
                }
            
            context = "\n\n".join(relevant_content[:5])  # Limitar contexto
        
        # Definir niveles de dificultad
        difficulty_instructions = {
            "easy": "Preguntas básicas que evalúan comprensión fundamental. Respuestas directas del contenido. Ideal para principiantes.",
            "medium": "Preguntas que requieren comprensión y aplicación de conceptos. Pueden combinar varios conceptos. Nivel intermedio.",
            "hard": "Preguntas complejas que requieren análisis, síntesis y aplicación avanzada de conceptos. Nivel avanzado."
        }
        
        # Construir instrucciones específicas según si hay tema o no
        if use_specific_topic:
            topic_instruction = f"""
IMPORTANTE: El usuario ha solicitado específicamente un test sobre: {', '.join(topics)}
DEBES generar preguntas EXACTAMENTE sobre este tema, incluso si no hay contenido en la memoria.
Usa tu conocimiento general para crear preguntas relevantes sobre este tema específico.
"""
        else:
            topic_instruction = "Genera preguntas basándote en el contenido proporcionado."
        
        # Añadir restricciones/condiciones si se proporcionan
        constraints_instruction = ""
        if constraints:
            constraints_instruction = f"""
RESTRICCIONES Y CONDICIONES OBLIGATORIAS:
{constraints}

⚠️ CRÍTICO: DEBES RESPETAR ABSOLUTAMENTE estas restricciones en TODAS las preguntas del test.
- Si se especifican números permitidos, SOLO usa esos números en las preguntas y respuestas.
- Si se especifican condiciones sobre el formato, estructura o contenido, DEBES seguirlas estrictamente.
- NO ignores estas restricciones bajo ninguna circunstancia.
- Verifica que cada pregunta cumpla con todas las restricciones antes de incluirla en el test.
"""
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """Eres un experto en evaluación educativa. Generas tests de alta calidad que evalúan comprensión real.
            Debes generar preguntas variadas: opción múltiple, verdadero/falso.
            Cada pregunta debe tener una respuesta correcta clara y una explicación.
            Si el usuario solicita un tema específico, DEBES generar preguntas sobre ese tema exacto, usando tu conocimiento si es necesario."""),
            ("user", """Genera un test educativo en formato JSON basándote en el siguiente contenido:

CONTENIDO:
{context}

{topic_instruction}

{constraints_instruction}

REQUISITOS:
- Número de preguntas: {num_questions}
- Dificultad: {difficulty}
- Instrucciones de dificultad: {difficulty_instructions}

FORMATO DE RESPUESTA (JSON válido):
{{
    "questions": [
        {{
            "id": "q1",
            "type": "multiple_choice",
            "question": "Texto de la pregunta aquí",
            "options": [
                "Opción A completa",
                "Opción B completa",
                "Opción C completa",
                "Opción D completa"
            ],
            "correct_answer": "A",
            "explanation": "Explicación breve de por qué esta es la respuesta correcta"
        }},
        {{
            "id": "q2",
            "type": "true_false",
            "question": "Texto de la pregunta aquí",
            "correct_answer": "True",
            "explanation": "Explicación de la respuesta"
        }}
    ]
}}

TIPOS PERMITIDOS:
- "multiple_choice": 4 opciones (A, B, C, D)
- "true_false": Verdadero o Falso

REGLAS CRÍTICAS PARA PREGUNTAS DE OPCIÓN MÚLTIPLE:
1. **NO HAYAS OPCIONES DUPLICADAS NI EQUIVALENTES**: Cada opción debe ser ÚNICA y MATEMÁTICAMENTE DIFERENTE de las demás. 
   - Si la pregunta es matemática, NO puedes tener opciones equivalentes (ej: "2/3" y "4/6" son equivalentes, solo una debe aparecer).
   - Si la pregunta es "¿Cuánto es 3+3?", NO puedes tener dos opciones con el mismo valor (ej: "6" en A y "6" en D).
   - Fracciones equivalentes como 1/2, 2/4, 3/6 NO pueden aparecer juntas. Solo una forma debe estar presente.
2. **UNA SOLA RESPUESTA CORRECTA**: DEBE haber exactamente UNA respuesta correcta. Si hay múltiples opciones que son matemáticamente correctas, solo UNA debe estar marcada como "correct_answer".
3. **VERIFICA LA RESPUESTA CORRECTA**: El campo "correct_answer" DEBE corresponder exactamente a una de las opciones (A, B, C o D). La opción indicada en "correct_answer" DEBE ser realmente la respuesta correcta a la pregunta.
4. **OPCIONES DISTINTAS**: Cada opción debe representar un valor o concepto diferente. No uses formas equivalentes de la misma respuesta.
5. **COHERENCIA**: La explicación debe justificar por qué la opción marcada como "correct_answer" es la correcta y por qué las otras son incorrectas.

IMPORTANTE:
- Solo devuelve el JSON, sin texto adicional
- Todas las preguntas deben tener explicaciones
- Las opciones deben ser completas y claras
- Asegúrate de que el JSON sea válido
- VERIFICA que no haya opciones duplicadas antes de devolver el JSON
- VERIFICA que la respuesta correcta sea realmente correcta""")
        ])
        
        try:
            chain = prompt_template | self.llm
            response = chain.invoke({
                "context": context,
                "topic_instruction": topic_instruction,
                "constraints_instruction": constraints_instruction,
                "num_questions": num_questions,
                "difficulty": difficulty,
                "difficulty_instructions": difficulty_instructions.get(difficulty, difficulty_instructions["medium"])
            })
            
            # Parsear respuesta JSON
            response_text = response.content.strip()
            
            # Limpiar markdown si existe
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            # Intentar parsear JSON
            try:
                test_data = json.loads(response_text)
            except json.JSONDecodeError:
                # Intentar encontrar JSON en la respuesta
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                if start >= 0 and end > start:
                    test_data = json.loads(response_text[start:end])
                else:
                    raise ValueError("No se pudo encontrar JSON válido en la respuesta")
            
            # Validar estructura
            if "questions" not in test_data:
                return {
                    "error": "El formato del test generado no es válido.",
                    "test_id": test_id,
                    "raw_response": response_text
                }
            
            # Asegurar que cada pregunta tenga un ID y validar/corregir opciones
            for i, q in enumerate(test_data["questions"]):
                if "id" not in q:
                    q["id"] = f"q{i+1}"
                
                # Validar y corregir preguntas de opción múltiple
                if q.get("type") == "multiple_choice":
                    options = q.get("options", [])
                    correct_answer = q.get("correct_answer", "").strip().upper()
                    
                    # Verificar que haya exactamente 4 opciones
                    if len(options) != 4:
                        print(f"⚠️ Pregunta {q.get('id', f'q{i+1}')} no tiene 4 opciones, tiene {len(options)}")
                        # Ajustar a 4 opciones si es necesario
                        while len(options) < 4:
                            options.append(f"Opción {chr(65 + len(options))} (opción adicional)")
                        options = options[:4]
                        q["options"] = options
                    
                    # Detectar y eliminar opciones duplicadas y equivalentes matemáticamente
                    seen_values = {}  # {valor_texto: índice_original}
                    seen_math_values = {}  # {valor_matemático: (índice, expresión)}
                    duplicates_to_fix = []  # [(índice_duplicado, valor, texto_normalizado, es_equivalente_math)]
                    
                    # Primera pasada: identificar duplicados
                    for idx, opt in enumerate(options):
                        # Normalizar la opción para comparar (remover prefijos A), B), etc.)
                        opt_normalized = opt.strip()
                        # Remover prefijos comunes como "A) ", "B) ", "A. ", etc.
                        if len(opt_normalized) > 2:
                            # Buscar patrones como "A) ", "B. ", "C: ", etc.
                            if opt_normalized[1] in [')', '.', ':']:
                                opt_normalized = opt_normalized[2:].strip()
                            elif opt_normalized[0].isalpha() and opt_normalized[1:3] in [' - ', ' -', '- ']:
                                opt_normalized = opt_normalized[3:].strip()
                        
                        # Evaluar expresión matemática si es posible
                        math_value = self._evaluate_math_expression(opt_normalized)
                        
                        # Verificar duplicados exactos (texto)
                        opt_value_text = ' '.join(opt_normalized.lower().split())
                        if opt_value_text in seen_values:
                            original_idx = seen_values[opt_value_text]
                            print(f"⚠️ Opción duplicada exacta encontrada en pregunta {q.get('id', f'q{i+1}')}: opción {chr(65 + idx)} '{opt}' es idéntica a opción {chr(65 + original_idx)}")
                            duplicates_to_fix.append((idx, opt_value_text, opt_normalized, False))
                        else:
                            seen_values[opt_value_text] = idx
                        
                        # Verificar equivalentes matemáticos
                        if math_value is not None:
                            # Buscar si hay otra opción con el mismo valor matemático
                            found_equivalent = False
                            for seen_math_val, (seen_idx, seen_expr) in seen_math_values.items():
                                if seen_math_val is not None and abs(seen_math_val - math_value) < 1e-10:
                                    print(f"⚠️ Opción matemáticamente equivalente encontrada en pregunta {q.get('id', f'q{i+1}')}: opción {chr(65 + idx)} '{opt}' ({math_value}) es equivalente a opción {chr(65 + seen_idx)} '{seen_expr}' ({seen_math_val})")
                                    duplicates_to_fix.append((idx, opt_value_text, opt_normalized, True))
                                    found_equivalent = True
                                    break
                            
                            if not found_equivalent:
                                # No se encontró equivalente, agregar a la lista
                                seen_math_values[math_value] = (idx, opt_normalized)
                        else:
                            # No es una expresión matemática evaluable, pero agregar de todas formas para referencia
                            seen_math_values[None] = (idx, opt_normalized)
                    
                    # Segunda pasada: corregir duplicados y equivalentes (proteger la respuesta correcta)
                    correct_idx = ord(correct_answer) - 65 if correct_answer in ["A", "B", "C", "D"] else -1
                    
                    for dup_idx, dup_value, dup_text, is_math_equivalent in duplicates_to_fix:
                        # No modificar la opción correcta si es la única con ese valor
                        if dup_idx == correct_idx:
                            # Si la correcta es duplicada/equivalente, mantenerla y cambiar la otra
                            if is_math_equivalent:
                                # Buscar la otra opción equivalente
                                dup_math_val = self._evaluate_math_expression(dup_text)
                                for seen_math_val, (orig_idx, orig_expr) in seen_math_values.items():
                                    if orig_idx != correct_idx and seen_math_val is not None and dup_math_val is not None:
                                        if abs(seen_math_val - dup_math_val) < 1e-10:
                                            # Son equivalentes, cambiar la otra
                                            letter = chr(65 + orig_idx)
                                            # Generar un valor diferente
                                            new_value = seen_math_val + 1 if seen_math_val >= 0 else seen_math_val - 1
                                            options[orig_idx] = f"{letter}) {new_value}"
                                            break
                            else:
                                # Buscar duplicado exacto
                                for val, orig_idx in seen_values.items():
                                    if orig_idx != correct_idx and val == dup_value:
                                        # Son duplicados exactos, cambiar la otra
                                        letter = chr(65 + orig_idx)
                                        # Intentar generar un valor diferente
                                        numbers = re.findall(r'-?\d+\.?\d*', options[orig_idx])
                                        if numbers:
                                            base_num = float(numbers[0]) if '.' in numbers[0] else int(numbers[0])
                                            new_value = base_num + 1 if base_num >= 0 else base_num - 1
                                            options[orig_idx] = f"{letter}) {new_value}"
                                        else:
                                            options[orig_idx] = f"{letter}) Opción alternativa"
                                        break
                        else:
                            # Cambiar la opción duplicada/equivalente que NO es la correcta
                            letter = chr(65 + dup_idx)
                            if is_math_equivalent:
                                # Es equivalente matemático, generar un valor diferente
                                math_val = self._evaluate_math_expression(dup_text)
                                if math_val is not None:
                                    new_value = math_val + 1 if math_val >= 0 else math_val - 1
                                    options[dup_idx] = f"{letter}) {new_value}"
                                else:
                                    options[dup_idx] = f"{letter}) Opción alternativa"
                            else:
                                # Es duplicado exacto
                                numbers = re.findall(r'-?\d+\.?\d*', dup_text)
                                if numbers:
                                    base_num = float(numbers[0]) if '.' in numbers[0] else int(numbers[0])
                                    new_value = base_num + 1 if base_num >= 0 else base_num - 1
                                    options[dup_idx] = f"{letter}) {new_value}"
                                else:
                                    options[dup_idx] = f"{letter}) Opción alternativa"
                    
                    q["options"] = options
                    
                    # Verificar que la respuesta correcta sea válida (A, B, C o D)
                    if correct_answer not in ["A", "B", "C", "D"]:
                        print(f"⚠️ Respuesta correcta inválida '{correct_answer}' en pregunta {q.get('id', f'q{i+1}')}, usando 'A' por defecto")
                        q["correct_answer"] = "A"
                    else:
                        # Verificar que la opción correcta sea realmente diferente de las incorrectas
                        correct_idx = ord(correct_answer) - 65  # 0, 1, 2, 3
                        if correct_idx < len(options):
                            correct_option = options[correct_idx]
                            # Normalizar la opción correcta
                            correct_normalized = correct_option.strip()
                            if len(correct_normalized) > 2 and correct_normalized[1] in [')', '.', ':']:
                                correct_normalized = correct_normalized[2:].strip()
                            
                            correct_math_val = self._evaluate_math_expression(correct_normalized)
                            
                            # Verificar que no haya otra opción idéntica o equivalente
                            for idx, opt in enumerate(options):
                                if idx != correct_idx:
                                    opt_normalized = opt.strip()
                                    # Remover prefijos
                                    if len(opt_normalized) > 2 and opt_normalized[1] in [')', '.', ':']:
                                        opt_normalized = opt_normalized[2:].strip()
                                    
                                    # Verificar duplicado exacto
                                    if opt_normalized == correct_normalized:
                                        print(f"⚠️ La opción correcta '{correct_answer}' tiene el mismo valor que otra opción en pregunta {q.get('id', f'q{i+1}')}")
                                        # Cambiar la opción duplicada
                                        letter = chr(65 + idx)
                                        options[idx] = f"{letter}) Opción incorrecta {idx + 1}"
                                    # Verificar equivalente matemático
                                    elif correct_math_val is not None:
                                        opt_math_val = self._evaluate_math_expression(opt_normalized)
                                        if opt_math_val is not None and abs(opt_math_val - correct_math_val) < 1e-10:
                                            print(f"⚠️ La opción correcta '{correct_answer}' es matemáticamente equivalente a otra opción en pregunta {q.get('id', f'q{i+1}')}")
                                            # Cambiar la opción equivalente
                                            letter = chr(65 + idx)
                                            new_value = opt_math_val + 1 if opt_math_val >= 0 else opt_math_val - 1
                                            options[idx] = f"{letter}) {new_value}"
                            q["options"] = options
            
            # Añadir metadatos
            test_data["test_id"] = test_id
            test_data["difficulty"] = difficulty
            test_data["num_questions"] = len(test_data["questions"])
            
            # Almacenar test
            self.generated_tests[test_id] = test_data
            
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
            
            # Añadir información de tokens al test
            test_data["usage_info"] = usage_info
            
            return test_data
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error generando test: {error_msg}")
            return {
                "error": f"Error al generar el test: {error_msg}",
                "test_id": test_id
            }
    
    def get_test(self, test_id: str) -> Dict:
        """
        Obtiene un test generado previamente
        
        Args:
            test_id: ID del test
            
        Returns:
            Test almacenado
        """
        return self.generated_tests.get(test_id, {"error": "Test no encontrado"})
    
    def adapt_difficulty(self, user_performance: Dict) -> str:
        """
        Adapta la dificultad basándose en el rendimiento del usuario
        
        Args:
            user_performance: Diccionario con métricas de rendimiento
            
        Returns:
            Nueva dificultad recomendada
        """
        score = user_performance.get("score", 0)
        
        if score >= 0.8:
            return "hard"
        elif score >= 0.6:
            return "medium"
        else:
            return "easy"
