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
import sys

# Importar model_manager
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from model_manager import ModelManager
except ImportError:
    ModelManager = None
    print("⚠️ Warning: model_manager no disponible, usando OpenAI directamente")

class TestGeneratorAgent:
    """
    Agente especializado en generar tests y ejercicios interactivos
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente generador de tests
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        self.llm = None  # Se inicializará cuando se necesite
        self.model_manager = None
        self.current_model_config = None
        
        # Inicializar model_manager si está disponible
        if ModelManager:
            try:
                self.model_manager = ModelManager(api_key=self.api_key, mode=mode)
                print("🤖 Test Generator Agent inicializado con ModelManager (modo automático)")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar ModelManager: {e}")
                self.model_manager = None
        else:
            # Fallback a OpenAI directo
            if self.api_key:
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",  # Usar modelo más barato por defecto
                        temperature=0.8,
                        api_key=self.api_key
                    )
                    print("🤖 Test Generator Agent inicializado (sin ModelManager, usando gpt-3.5-turbo)")
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
            # Limpiar la expresión y remover espacios
            expr = expr.strip().replace(' ', '')
            
            # Intentar evaluar como fracción (ej: "2/3", "4/6", "1/2")
            if '/' in expr:
                try:
                    parts = expr.split('/')
                    if len(parts) == 2:
                        num_str = parts[0].strip()
                        den_str = parts[1].strip()
                        # Remover cualquier carácter no numérico (excepto signo negativo y punto decimal)
                        num_str = re.sub(r'[^\d\.\-]', '', num_str)
                        den_str = re.sub(r'[^\d\.\-]', '', den_str)
                        if num_str and den_str:
                            num = float(num_str)
                            den = float(den_str)
                            if den != 0:
                                return num / den
                except:
                    pass
            
            # Intentar evaluar directamente como número
            try:
                # Remover caracteres no numéricos (excepto signo negativo, punto decimal y 'e' para notación científica)
                cleaned = re.sub(r'[^\d\.\-\+eE]', '', expr)
                if cleaned:
                    result = float(cleaned)
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
    
    def generate_test(self, difficulty: str = "medium", num_questions: int = 10, topics: Optional[List[str]] = None, constraints: Optional[str] = None, model: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict:
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
            Test generado con preguntas y respuestas correctas
        """
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    preferred_model=model if model else None
                )
                print(f"✅ Usando modelo: {self.current_model_config.name} (costo: ${self.current_model_config.cost_per_1k_input:.4f}/{self.current_model_config.cost_per_1k_output:.4f} por 1k tokens)")
            except Exception as e:
                error_msg = f"⚠️ Error al seleccionar modelo automáticamente: {str(e)}"
                print(error_msg)
                # Fallback: intentar con OpenAI si hay API key
                if self.api_key:
                    try:
                        self.llm = ChatOpenAI(
                            model="gpt-3.5-turbo",  # Modelo más barato
                            temperature=0.8,
                            api_key=self.api_key
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return {
                            "error": f"Error al inicializar el modelo: {str(e2)}",
                            "test_id": str(uuid.uuid4())[:8]
                        }
                else:
                    return {
                        "error": "Se requiere configurar una API key de OpenAI o tener Ollama instalado. Por favor, configura tu API key o instala Ollama.",
                        "test_id": str(uuid.uuid4())[:8]
                    }
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return {
                    "error": "Se requiere configurar una API key de OpenAI para generar tests. Por favor, configura tu API key.",
                    "test_id": str(uuid.uuid4())[:8]
                }
            
            # Usar modelo especificado o el más barato disponible
            model_to_use = model if model else "gpt-3.5-turbo"  # Por defecto usar el más barato
            
            try:
                self.llm = ChatOpenAI(
                    model=model_to_use,
                    temperature=0.8,
                    api_key=self.api_key
                )
            except Exception as e:
                # Fallback a gpt-3.5-turbo si el modelo especificado falla
                try:
                    print(f"⚠️ Modelo {model_to_use} no disponible, usando gpt-3.5-turbo como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.8,
                        api_key=self.api_key
                    )
                except Exception as e2:
                    return {
                        "error": f"Error al inicializar el modelo: {str(e2)}",
                        "test_id": str(uuid.uuid4())[:8]
                    }
        
        test_id = str(uuid.uuid4())[:8]
        
        # DEBUG: Verificar qué se recibe
        print(f"🔍 DEBUG - Generando test:")
        print(f"  - conversation_history recibido: {conversation_history is not None}")
        if conversation_history:
            print(f"  - Número de mensajes en historial: {len(conversation_history)}")
            if len(conversation_history) > 0:
                print(f"  - Primer mensaje: {conversation_history[0]}")
                print(f"  - Último mensaje: {conversation_history[-1]}")
        
        # Construir contexto PRIORIZANDO la conversación más reciente
        context_parts = []
        use_specific_topic = False
        
        # 1. Si hay temas específicos, añadirlos
        if topics and len(topics) > 0:
            use_specific_topic = True
            context_parts.append(f"Tema específico solicitado: {', '.join(topics)}")
        
        # 2. PRIORIDAD: Añadir historial de conversación PRIMERO (más reciente primero)
        conversation_text = ""
        recent_topic_keywords = ""
        main_topic = ""  # Tema principal detectado (inicializado aquí para que esté disponible después)
        print(f"🔍 DEBUG - Verificando conversación:")
        print(f"  - conversation_history es None: {conversation_history is None}")
        if conversation_history:
            print(f"  - Longitud de conversation_history: {len(conversation_history)}")
            print(f"  - Primeros 3 mensajes: {conversation_history[:3] if len(conversation_history) >= 3 else conversation_history}")
        else:
            print(f"  - conversation_history es None o vacío")
        
        if conversation_history and len(conversation_history) > 0:
            # Filtrar solo mensajes relevantes (user y assistant, excluyendo system)
            relevant_messages = [
                msg for msg in conversation_history 
                if msg.get("role") in ["user", "assistant"] and msg.get("content")
            ]
            print(f"  - Mensajes relevantes después de filtrar: {len(relevant_messages)}")
            if relevant_messages:
                # Priorizar SOLO el último intercambio (usuario + asistente más reciente)
                # Esto asegura que solo usemos el tema más reciente y no temas antiguos
                # Buscar el índice del último mensaje del asistente (que suele ser el más relevante)
                last_assistant_idx = None
                for i in range(len(relevant_messages) - 1, -1, -1):
                    if relevant_messages[i].get('role') == 'assistant':
                        last_assistant_idx = i
                        break
                
                # Tomar el último mensaje del asistente y el mensaje del usuario anterior (si existe)
                if last_assistant_idx is not None:
                    if last_assistant_idx > 0 and relevant_messages[last_assistant_idx - 1].get('role') == 'user':
                        # Usar el último par usuario-asistente
                        recent_messages = relevant_messages[last_assistant_idx - 1:last_assistant_idx + 1]
                    else:
                        # Solo el último mensaje del asistente
                        recent_messages = [relevant_messages[last_assistant_idx]]
                else:
                    # Fallback: usar los últimos 2 mensajes
                    recent_messages = relevant_messages[-2:]
                
                # Invertir para poner los más recientes primero
                recent_messages_reversed = list(reversed(recent_messages))
                print(f"  - Usando SOLO {len(recent_messages)} mensajes más recientes (de {len(relevant_messages)} totales)")
                print(f"  - TODOS los mensajes que se usarán para el test (TEMA MÁS RECIENTE):")
                for i, msg in enumerate(recent_messages_reversed):
                    content_preview = msg.get('content', '')[:200]
                    role_emoji = "👤" if msg.get('role') == 'user' else "🤖"
                    print(f"    {i+1}. {role_emoji} {msg.get('role')}: {content_preview}...")
                
                # Extraer temas SOLO de los mensajes MÁS recientes (último intercambio)
                very_recent = recent_messages
                topic_extraction = []
                for msg in very_recent:
                    content = msg.get("content", "")
                    # Buscar solicitudes de apuntes o temas mencionados
                    if msg.get("role") == "user":
                        # Extraer temas mencionados en solicitudes
                        if "apuntes" in content.lower() or "notas" in content.lower():
                            # Extraer palabras después de "apuntes de" o "sobre"
                            patterns = [
                                r"apuntes\s+(?:de|sobre|acerca\s+de)\s+([^\.\?\!]+)",
                                r"notas\s+(?:de|sobre|acerca\s+de)\s+([^\.\?\!]+)",
                                r"(?:sobre|acerca\s+de)\s+([^\.\?\!]+)",
                            ]
                            for pattern in patterns:
                                match = re.search(pattern, content, re.IGNORECASE)
                                if match:
                                    topic_extraction.append(match.group(1).strip())
                        else:
                            # Añadir primeras palabras clave del mensaje
                            words = content.split()[:10]
                            topic_extraction.extend(words)
                
                # Combinar temas extraídos
                if topic_extraction:
                    recent_topic_keywords = " ".join(topic_extraction[:20])  # Limitar a 20 palabras clave
                    print(f"  - Palabras clave extraídas de los últimos mensajes: {recent_topic_keywords[:200]}")
                
                # Detectar el tema principal de los últimos mensajes
                main_topic = ""
                if recent_topic_keywords:
                    # Buscar palabras clave comunes de temas
                    topic_keywords_lower = recent_topic_keywords.lower()
                    if "japonés" in topic_keywords_lower or "japones" in topic_keywords_lower:
                        main_topic = "Japonés"
                    elif "react" in topic_keywords_lower:
                        main_topic = "React"
                    elif "api" in topic_keywords_lower or "apis" in topic_keywords_lower:
                        main_topic = "APIs"
                    elif "sql" in topic_keywords_lower:
                        main_topic = "SQL"
                    else:
                        # Tomar las primeras palabras clave como tema principal
                        main_topic = recent_topic_keywords.split()[:3][0] if recent_topic_keywords.split() else ""
                
                if main_topic:
                    print(f"  - 🎯 TEMA PRINCIPAL DETECTADO: {main_topic}")
                
                # Construir el texto de conversación SOLO con el último intercambio (usuario + asistente)
                # Limitar cada mensaje a 2000 caracteres para evitar que mensajes muy largos dominen
                conversation_parts = []
                for msg in recent_messages_reversed:
                    content = msg.get('content', '')
                    role_label = 'Usuario' if msg.get('role') == 'user' else 'Asistente'
                    # Limitar a 2000 caracteres, tomando del inicio (donde suele estar el tema principal)
                    if len(content) > 2000:
                        limited_content = content[:2000] + "\n[... contenido adicional omitido para enfocarse en el tema principal ...]"
                    else:
                        limited_content = content
                    conversation_parts.append(f"{role_label}: {limited_content}")
                
                conversation_text = "\n\n".join(conversation_parts)
                
                print(f"✅ Conversación extraída: {len(conversation_text)} caracteres de {len(recent_messages)} mensajes (ÚLTIMO intercambio, limitados a 2000 chars cada uno)")
                print(f"🔍 Tema detectado en conversación reciente: {recent_topic_keywords[:100] if recent_topic_keywords else 'No detectado'}")
                
                # Añadir un encabezado muy claro con separadores visuales
                context_parts.append("\n" + "=" * 100)
                context_parts.append("🚨🚨🚨 CONTENIDO PRINCIPAL - ÚLTIMO INTERCAMBIO (USAR SOLO ESTO) 🚨🚨🚨")
                context_parts.append("=" * 100)
                context_parts.append(conversation_text)
                context_parts.append("=" * 100)
                context_parts.append("\n⚠️⚠️⚠️ RECORDATORIO CRÍTICO:")
                if main_topic:
                    context_parts.append(f"- 🎯 TEMA PRINCIPAL DETECTADO: {main_topic}")
                    context_parts.append(f"- El test DEBE ser sobre {main_topic} SOLAMENTE.")
                    if main_topic != "SQL":
                        context_parts.append(f"- 🚫 PROHIBIDO ABSOLUTO: NO generar preguntas sobre SQL.")
                        context_parts.append(f"- 🚫 PROHIBIDO ABSOLUTO: NO usar información sobre SQL.")
                        context_parts.append(f"- El test debe ser 100% sobre {main_topic}, NADA MÁS.")
                    context_parts.append(f"- IGNORA COMPLETAMENTE cualquier mención de otros temas que no sean {main_topic}.")
                else:
                    context_parts.append("- El test DEBE ser sobre el tema de este último intercambio SOLAMENTE.")
                    context_parts.append("- Si este intercambio habla de 'Japonés', el test DEBE ser sobre Japonés, NO sobre SQL, NO sobre APIs.")
                    context_parts.append("- Si habla de 'React', el test DEBE ser sobre React, NO sobre SQL, NO sobre APIs.")
                    context_parts.append("- 🚫 PROHIBIDO ABSOLUTO: NO generar preguntas sobre temas antiguos (SQL, APIs, etc.) si el último intercambio es sobre otro tema.")
                    context_parts.append("- IGNORA COMPLETAMENTE cualquier mención de temas antiguos.")
                context_parts.append("- El test debe reflejar EXACTAMENTE el tema de este último intercambio.")
                context_parts.append("=" * 100 + "\n")
        
        # 3. PRIORIDAD ABSOLUTA: Si hay conversación reciente, NO usar documentos antiguos
        relevant_content = []
        
        print(f"🔍 DEBUG - Estado final de conversation_text:")
        print(f"  - conversation_text existe: {bool(conversation_text)}")
        print(f"  - Longitud de conversation_text: {len(conversation_text) if conversation_text else 0}")
        if conversation_text:
            print(f"  - Primeros 200 caracteres: {conversation_text[:200]}")
        
        # Si hay conversación (aunque sea corta), NO buscar documentos
        # La conversación siempre tiene prioridad sobre documentos antiguos
        if conversation_text and len(conversation_text) > 50:
            # Hay conversación, NO buscar documentos para evitar confusión
            print("✅ Hay conversación reciente, omitiendo completamente documentos antiguos del PDF")
            print(f"📝 Longitud de conversación: {len(conversation_text)} caracteres")
        elif not conversation_text or len(conversation_text) <= 50:
            # Solo si NO hay conversación o es muy corta, buscar documentos
            print(f"⚠️ No hay conversación suficiente (longitud: {len(conversation_text) if conversation_text else 0}), buscando documentos como último recurso")
            query = "conceptos principales del temario"
            relevant_content = self.memory.retrieve_relevant_content(query, n_results=2)
            if relevant_content:
                context_parts.append("\n\nCONTEXTO - DOCUMENTOS SUBIDOS (solo porque no hay conversación):")
                context_parts.append("\n\n".join(relevant_content[:1]))
        
        # Combinar todo el contexto
        context = "\n\n".join(context_parts)
        
        # Si no hay ningún contexto disponible, retornar error
        if not context.strip() or (not conversation_text and not relevant_content and not topics):
            return {
                "error": "No hay contenido disponible para generar el test. Por favor, sube documentos, ten una conversación en el chat, o especifica un tema para el test.",
                "test_id": test_id
            }
        
        # Definir niveles de dificultad
        difficulty_instructions = {
            "easy": "Preguntas básicas que evalúan comprensión fundamental. Respuestas directas del contenido. Ideal para principiantes.",
            "medium": "Preguntas que requieren comprensión y aplicación de conceptos. Pueden combinar varios conceptos. Nivel intermedio.",
            "hard": "Preguntas complejas que requieren análisis, síntesis y aplicación avanzada de conceptos. Nivel avanzado."
        }
        
        # Construir instrucciones específicas según si hay tema o no
        has_documents = bool(relevant_content)
        has_conversation = bool(conversation_text and len(conversation_text) > 50)
        
        print(f"🔍 DEBUG - Estado del contexto:")
        print(f"  - has_conversation: {has_conversation} (longitud: {len(conversation_text) if conversation_text else 0})")
        print(f"  - has_documents: {has_documents}")
        print(f"  - use_specific_topic: {use_specific_topic}")
        
        if use_specific_topic:
            topic_instruction = f"""
IMPORTANTE: El usuario ha solicitado específicamente un test sobre: {', '.join(topics)}
DEBES generar preguntas EXACTAMENTE sobre este tema, incluso si no hay contenido en la memoria.
Usa tu conocimiento general para crear preguntas relevantes sobre este tema específico.
"""
        else:
            if has_conversation:
                # Extraer el tema más reciente de la conversación para reforzar
                most_recent_topic = ""
                if recent_topic_keywords:
                    most_recent_topic = f"\n\n🎯 TEMA MÁS RECIENTE DETECTADO EN LOS ÚLTIMOS 3 MENSAJES: {recent_topic_keywords[:150]}\n"
                
                # Construir instrucción específica basada en el tema detectado
                topic_specific_instruction = ""
                if main_topic and main_topic != "SQL":
                    topic_specific_instruction = f"""
🚨🚨🚨 TEMA PRINCIPAL DETECTADO: {main_topic} 🚨🚨🚨

EL TEST DEBE SER SOBRE {main_topic} EXCLUSIVAMENTE.

PROHIBIDO ABSOLUTO:
- NO generar preguntas sobre SQL
- NO generar preguntas sobre otros temas que no sean {main_topic}
- NO usar información de mensajes antiguos sobre SQL u otros temas
- El test DEBE ser 100% sobre {main_topic}

"""
                elif main_topic == "SQL":
                    topic_specific_instruction = f"""
🚨🚨🚨 TEMA PRINCIPAL DETECTADO: {main_topic} 🚨🚨🚨

EL TEST DEBE SER SOBRE {main_topic} EXCLUSIVAMENTE.

"""
                
                # Si hay conversación, instrucciones muy claras de ignorar documentos
                topic_instruction = f"""
🚨🚨🚨 INSTRUCCIÓN CRÍTICA - PRIORIDAD ABSOLUTA 🚨🚨🚨:

EL TEST DEBE ESTAR BASADO EXCLUSIVAMENTE Y ÚNICAMENTE EN EL ÚLTIMO INTERCAMBIO (último mensaje usuario + último mensaje asistente) DE LA CONVERSACIÓN PROPORCIONADA ARRIBA.

{most_recent_topic}
{topic_specific_instruction}

REGLAS OBLIGATORIAS (NO NEGOCIABLES):
1. El test DEBE ser 100% sobre el tema que se está discutiendo en el ÚLTIMO INTERCAMBIO de la conversación.
2. Si el último intercambio habla de "Japonés", el test DEBE ser sobre Japonés, NO sobre SQL, NO sobre React, NO sobre APIs, NO sobre otros temas antiguos.
3. Si el último intercambio habla de "React", el test DEBE ser sobre React, NO sobre SQL, NO sobre APIs, NO sobre otros temas.
4. Si el último intercambio habla de "APIs", el test DEBE ser sobre APIs, NO sobre SQL, NO sobre otros temas.
5. Si se generaron apuntes sobre "Japonés" en el último intercambio, el test DEBE ser sobre Japonés.
6. 🚫 PROHIBIDO ABSOLUTO: NO generar preguntas sobre temas antiguos (SQL, APIs, React, etc.) si el último intercambio es sobre otro tema.
7. IGNORA COMPLETAMENTE cualquier información sobre temas que NO aparezcan en el último intercambio.
8. Si hay documentos o información sobre SQL/APIs/React pero el último intercambio es sobre Japonés, IGNORA esos temas completamente.
9. El tema del test debe reflejar EXACTAMENTE lo que se ha estado discutiendo en el ÚLTIMO INTERCAMBIO de la conversación.

⚠️⚠️⚠️ PROHIBIDO usar información de temas antiguos (como SQL, APIs, React) si el último intercambio es sobre otro tema (como Japonés).
⚠️⚠️⚠️ El test debe ser 100% sobre el tema del último intercambio, NADA MÁS.
⚠️⚠️⚠️ Si el último intercambio habla de Japonés y hay información antigua sobre SQL/APIs/React, IGNORA esos temas completamente y haz el test sobre Japonés.
⚠️⚠️⚠️ NO uses información de mensajes anteriores al último intercambio.
⚠️⚠️⚠️ Si ves palabras como "SQL", "APIs", "React" en el contexto pero el último intercambio es sobre Japonés, IGNORA esos temas completamente.
"""
            elif has_documents:
                topic_instruction = "Genera preguntas basándote en el contenido de los documentos proporcionados."
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
            
            🚨🚨🚨 REGLA CRÍTICA DE PRIORIZACIÓN (NO NEGOCIABLE) 🚨🚨🚨:
            - El test DEBE estar basado EXCLUSIVAMENTE en el ÚLTIMO INTERCAMBIO (último mensaje usuario + último mensaje asistente) de la conversación proporcionada.
            - Si el último intercambio habla de "Japonés", el test DEBE ser sobre Japonés, NO sobre SQL, NO sobre React, NO sobre APIs, NO sobre otros temas.
            - Si el último intercambio habla de "React", el test DEBE ser sobre React, NO sobre SQL, NO sobre APIs, NO sobre otros temas antiguos.
            - Si el último intercambio habla de "APIs", el test DEBE ser sobre APIs, NO sobre SQL, NO sobre otros temas.
            - 🚫 PROHIBIDO ABSOLUTO: NO generar preguntas sobre temas antiguos (SQL, APIs, React, etc.) si el último intercambio es sobre otro tema.
            - IGNORA COMPLETAMENTE cualquier información sobre temas que NO aparezcan en el último intercambio.
            - Si hay información sobre SQL/APIs/React en mensajes antiguos pero el último intercambio es sobre Japonés, IGNORA esos temas completamente.
            - El tema del test debe reflejar EXACTAMENTE lo discutido en el ÚLTIMO INTERCAMBIO de la conversación.
            - Si el usuario solicita un tema específico, DEBES generar preguntas sobre ese tema exacto, usando tu conocimiento si es necesario."""),
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
3. **VERIFICA LA RESPUESTA CORRECTA**: 
   - El campo "correct_answer" DEBE corresponder exactamente a una de las opciones (A, B, C o D).
   - La opción indicada en "correct_answer" DEBE ser REALMENTE la respuesta correcta a la pregunta.
   - ANTES de marcar una opción como "correct_answer", VERIFICA que esa opción sea realmente la respuesta correcta.
   - NO marques una opción como correcta solo porque "suena bien" o "parece correcta". DEBE ser objetivamente la respuesta correcta.
   - Si tienes dudas sobre cuál es la respuesta correcta, revisa el contenido proporcionado y asegúrate de que la opción marcada como "correct_answer" sea realmente la correcta.
4. **OPCIONES DISTINTAS**: Cada opción debe representar un valor o concepto diferente. No uses formas equivalentes de la misma respuesta.
5. **COHERENCIA**: La explicación debe justificar por qué la opción marcada como "correct_answer" es la correcta y por qué las otras son incorrectas. La explicación DEBE coincidir con la opción marcada como correcta.

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
                            # También remover si empieza con letra seguida de espacio
                            elif opt_normalized[0].isalpha() and len(opt_normalized) > 1 and opt_normalized[1] == ' ':
                                opt_normalized = opt_normalized[2:].strip()
                        
                        # Evaluar expresión matemática si es posible (usar la versión normalizada)
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
                                    elif len(opt_normalized) > 1 and opt_normalized[0].isalpha() and opt_normalized[1] == ' ':
                                        opt_normalized = opt_normalized[2:].strip()
                                    
                                    # Verificar duplicado exacto
                                    if opt_normalized == correct_normalized:
                                        print(f"⚠️ La opción correcta '{correct_answer}' tiene el mismo valor que otra opción en pregunta {q.get('id', f'q{i+1}')}")
                                        # Cambiar la opción duplicada
                                        letter = chr(65 + idx)
                                        options[idx] = f"{letter}) Opción incorrecta {idx + 1}"
                                    # Verificar equivalente matemático (incluyendo fracciones)
                                    elif correct_math_val is not None:
                                        opt_math_val = self._evaluate_math_expression(opt_normalized)
                                        if opt_math_val is not None and abs(opt_math_val - correct_math_val) < 1e-10:
                                            print(f"⚠️ La opción correcta '{correct_answer}' ({correct_normalized} = {correct_math_val}) es matemáticamente equivalente a otra opción '{opt_normalized}' ({opt_math_val}) en pregunta {q.get('id', f'q{i+1}')}")
                                            # Cambiar la opción equivalente
                                            letter = chr(65 + idx)
                                            # Generar un valor diferente que no sea equivalente
                                            if opt_math_val == 0:
                                                new_value = 1
                                            elif opt_math_val > 0:
                                                new_value = opt_math_val + 0.5
                                            else:
                                                new_value = opt_math_val - 0.5
                                            # Si es una fracción, intentar mantener formato de fracción pero diferente
                                            if '/' in opt_normalized:
                                                # Generar una fracción diferente pero cercana
                                                base_num = int(abs(opt_math_val) * 2) if abs(opt_math_val) < 10 else int(abs(opt_math_val))
                                                new_num = base_num + 1
                                                new_den = 2
                                                options[idx] = f"{letter}) {new_num}/{new_den}"
                                            else:
                                                options[idx] = f"{letter}) {new_value}"
                            q["options"] = options
                            
                            # Verificación final: asegurar que no queden equivalentes después de la corrección
                            final_correct_normalized = options[correct_idx].strip()
                            if len(final_correct_normalized) > 2 and final_correct_normalized[1] in [')', '.', ':']:
                                final_correct_normalized = final_correct_normalized[2:].strip()
                            final_correct_math_val = self._evaluate_math_expression(final_correct_normalized)
                            
                            if final_correct_math_val is not None:
                                for idx, opt in enumerate(options):
                                    if idx != correct_idx:
                                        opt_normalized = opt.strip()
                                        if len(opt_normalized) > 2 and opt_normalized[1] in [')', '.', ':']:
                                            opt_normalized = opt_normalized[2:].strip()
                                        opt_math_val = self._evaluate_math_expression(opt_normalized)
                                        if opt_math_val is not None and abs(opt_math_val - final_correct_math_val) < 1e-10:
                                            print(f"⚠️ ADVERTENCIA FINAL: Aún hay equivalencia matemática en pregunta {q.get('id', f'q{i+1}')} entre '{final_correct_normalized}' y '{opt_normalized}'. Corrigiendo...")
                                            letter = chr(65 + idx)
                                            if opt_math_val == 0:
                                                options[idx] = f"{letter}) 1"
                                            elif opt_math_val > 0:
                                                options[idx] = f"{letter}) {opt_math_val + 1}"
                                            else:
                                                options[idx] = f"{letter}) {opt_math_val - 1}"
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
