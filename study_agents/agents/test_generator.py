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
    
    def generate_test(self, difficulty: str = "medium", num_questions: int = 10, topics: Optional[List[str]] = None, constraints: Optional[str] = None, model: Optional[str] = None, conversation_history: Optional[List[Dict[str, str]]] = None, user_level: Optional[int] = None) -> Dict:
        """
        Genera un test personalizado
        
        Args:
            difficulty: Nivel de dificultad (easy, medium, hard)
            num_questions: Número de preguntas
            topics: Temas específicos (opcional)
            constraints: Restricciones o condiciones específicas para las preguntas (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            conversation_history: Historial de conversación del chat (opcional)
            user_level: Nivel del usuario en el tema (1-10, opcional)
            
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
                # PERO filtrar palabras de solicitud y buscar el tema real en mensajes anteriores
                very_recent = recent_messages
                
                # Palabras de solicitud que deben ser ignoradas
                request_words = {
                    "hazme", "haz", "hacer", "genera", "generar", "crea", "crear", "quiero", "quieres",
                    "test", "ejercicio", "ejercicios", "apuntes", "notas", "preguntas", "cuestionario",
                    "un", "una", "de", "sobre", "acerca", "con", "que", "me", "te", "le", "nos", "les",
                    "fácil", "facil", "difícil", "dificil", "medio", "medium", "easy", "hard"
                }
                
                topic_extraction = []
                
                # PRIMERO: Buscar en mensajes del asistente (que suelen contener el contenido real)
                for msg in very_recent:
                    if msg.get("role") == "assistant":
                        content = msg.get("content", "").lower()
                        # Buscar temas técnicos en el contenido del asistente
                        technical_keywords = {
                            "sql": ["sql", "select", "from", "where", "insert", "update", "delete", "database", "base de datos"],
                            "python": ["python", "def", "import", "class", "print", "lista", "diccionario"],
                            "javascript": ["javascript", "js", "function", "const", "let", "var", "react", "node"],
                            "react": ["react", "component", "jsx", "hook", "useState", "useEffect"],
                            "japonés": ["japonés", "japones", "hiragana", "katakana", "kanji", "nihongo"],
                            "api": ["api", "apis", "endpoint", "rest", "json", "http", "request"],
                        }
                        
                        for topic_name, keywords in technical_keywords.items():
                            if any(keyword in content for keyword in keywords):
                                topic_extraction.append(topic_name)
                                print(f"  - ✅ Tema técnico detectado en respuesta del asistente: {topic_name}")
                                break
                
                # SEGUNDO: Si no se encontró en el asistente, buscar en mensajes del usuario
                # pero filtrando palabras de solicitud
                if not topic_extraction:
                    for msg in very_recent:
                        if msg.get("role") == "user":
                            content = msg.get("content", "")
                            content_lower = content.lower()
                            
                            # Buscar patrones como "ejercicio de X", "test de X", "apuntes de X"
                            patterns = [
                                r"(?:ejercicio|test|apuntes|notas)\s+(?:de|sobre|acerca\s+de)\s+([^\.\?\!]+)",
                                r"(?:hazme|haz|genera|crea)\s+(?:un|una)?\s*(?:ejercicio|test|apuntes)?\s*(?:de|sobre|acerca\s+de)?\s*([^\.\?\!]+)",
                            ]
                            
                            for pattern in patterns:
                                match = re.search(pattern, content, re.IGNORECASE)
                                if match:
                                    extracted = match.group(1).strip()
                                    # Filtrar palabras de solicitud
                                    words = extracted.split()
                                    filtered_words = [w for w in words if w.lower() not in request_words and len(w) > 2]
                                    if filtered_words:
                                        topic_extraction.extend(filtered_words)
                                        print(f"  - ✅ Tema extraído de solicitud del usuario: {' '.join(filtered_words[:3])}")
                                        break
                            
                            # Si no se encontró con patrones, buscar palabras técnicas
                            technical_keywords = {
                                "sql": ["sql", "select", "from", "where", "insert", "update", "delete"],
                                "python": ["python", "def", "import", "class"],
                                "javascript": ["javascript", "js", "function", "react"],
                                "japonés": ["japonés", "japones", "hiragana", "katakana"],
                                "api": ["api", "apis", "endpoint", "rest"],
                            }
                            
                            for topic_name, keywords in technical_keywords.items():
                                if any(keyword in content_lower for keyword in keywords):
                                    topic_extraction.append(topic_name)
                                    print(f"  - ✅ Tema técnico detectado en solicitud del usuario: {topic_name}")
                                    break
                
                # TERCERO: Si aún no se encontró, buscar en mensajes anteriores (no solo el último intercambio)
                # para encontrar el tema que se estaba discutiendo
                if not topic_extraction and len(relevant_messages) > len(recent_messages):
                    print(f"  - 🔍 No se encontró tema en último intercambio, buscando en mensajes anteriores...")
                    # Buscar en los últimos 5 mensajes (más contexto)
                    extended_messages = relevant_messages[-5:]
                    for msg in extended_messages:
                        if msg.get("role") == "assistant":
                            content = msg.get("content", "").lower()
                            # Buscar temas técnicos
                            technical_keywords = {
                                "sql": ["sql", "select", "from", "where", "insert", "update", "delete", "database"],
                                "python": ["python", "def", "import", "class"],
                                "javascript": ["javascript", "js", "function", "react"],
                                "japonés": ["japonés", "japones", "hiragana", "katakana"],
                                "api": ["api", "apis", "endpoint", "rest"],
                            }
                            
                            for topic_name, keywords in technical_keywords.items():
                                if any(keyword in content for keyword in keywords):
                                    topic_extraction.append(topic_name)
                                    print(f"  - ✅ Tema técnico detectado en mensaje anterior del asistente: {topic_name}")
                                    break
                        
                        if topic_extraction:
                            break
                
                # Combinar temas extraídos (eliminar duplicados y mantener orden)
                unique_topics = []
                seen = set()
                for topic in topic_extraction:
                    topic_lower = topic.lower()
                    if topic_lower not in seen:
                        seen.add(topic_lower)
                        unique_topics.append(topic)
                
                if unique_topics:
                    recent_topic_keywords = " ".join(unique_topics[:5])  # Limitar a 5 temas únicos
                    print(f"  - Temas extraídos (sin duplicados): {recent_topic_keywords}")
                else:
                    recent_topic_keywords = ""
                    print(f"  - ⚠️ No se encontraron temas técnicos en los mensajes")
                
                # Detectar el tema principal de los temas extraídos
                main_topic = ""
                if unique_topics:
                    # Priorizar temas técnicos conocidos
                    topic_lower = recent_topic_keywords.lower()
                    if "sql" in topic_lower:
                        main_topic = "SQL"
                    elif "japonés" in topic_lower or "japones" in topic_lower:
                        main_topic = "Japonés"
                    elif "react" in topic_lower:
                        main_topic = "React"
                    elif "api" in topic_lower or "apis" in topic_lower:
                        main_topic = "APIs"
                    elif "python" in topic_lower:
                        main_topic = "Python"
                    elif "javascript" in topic_lower:
                        main_topic = "JavaScript"
                    else:
                        # Tomar el primer tema extraído
                        main_topic = unique_topics[0].capitalize() if unique_topics else ""
                
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
        
        # Crear instrucciones específicas según el nivel del usuario (0-10)
        level_adjustment_note = ""
        difficulty_instructions = None  # Se inicializará según el caso
        
        if user_level is not None:
            # Usar el nivel directamente (0-10) en lugar de mapear a easy/medium/hard
            if user_level == 0:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Principiante Total - Identificación Básica)
El usuario está en nivel {user_level}, está empezando desde cero.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
🚨 CRÍTICO: El usuario está en nivel 0, lo que significa que NO SABE NADA del tema. Las preguntas deben ser EXTREMADAMENTE BÁSICAS.

TIPO DE PREGUNTAS PERMITIDAS PARA NIVEL 0:
- SOLO preguntas de identificación básica: "¿Cuál de estos es un [concepto básico]?"
- Ejemplo para meses: "¿Cuál de estos es un Mes?" con opciones: "Enero, Champiñón, Lunes, Koala"
- Las opciones incorrectas DEBEN ser OBVIAMENTE diferentes y no relacionadas (días de la semana, animales, objetos, colores, etc.)
- El usuario solo necesita reconocer el concepto básico, NO necesita conocimiento específico del tema

PROHIBIDO ABSOLUTAMENTE PARA NIVEL 0:
❌ NO preguntar sobre orden, posición, o números (ej: "¿Cuál es el séptimo mes?")
❌ NO preguntar sobre características específicas (ej: "¿Qué mes no tiene día 30?")
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")
❌ NO preguntar sobre hemisferios, estaciones, o conceptos avanzados
❌ NO incluir cálculos, fechas, números, o relaciones complejas
❌ NO preguntar sobre detalles, excepciones, o casos especiales

EJEMPLOS CORRECTOS PARA NIVEL 0:
✅ "¿Cuál de estos es un Mes?" → Opciones: "Enero, Champiñón, Lunes, Koala"
✅ "¿Cuál de estos es un Color?" → Opciones: "Rojo, Piano, Martes, Perro"
✅ "¿Cuál de estos es un Animal?" → Opciones: "Perro, Enero, Azul, Lunes"

Las preguntas deben ser tan simples que alguien que NO SABE NADA del tema pueda responder correctamente solo reconociendo el concepto básico.
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Identificación básica. El usuario debe reconocer conceptos fundamentales entre opciones claramente diferentes."
            elif user_level == 1:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Principiante - Identificación con Distractores Similares)
El usuario está en nivel {user_level}, apenas conoce lo básico.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- SOLO preguntas de identificación básica con distractores del mismo dominio
- Ejemplo: "¿Cuál de estos es un Mes?" → Opciones: "Enero, Febrero, Lunes, Martes" (meses vs días de la semana)
- Las opciones incorrectas deben ser del mismo dominio pero incorrectas (ej: si pregunta sobre meses, opciones incorrectas pueden ser otros meses o días de la semana)
- Enfocarse en distinguir conceptos básicos similares dentro del mismo dominio
- NO incluir números, orden, posición, características, o relaciones
- NO incluir conocimiento sobre estaciones, hemisferios, o conceptos avanzados

PROHIBIDO PARA NIVEL 1:
❌ NO preguntar sobre orden, posición, números, o relaciones
❌ NO preguntar sobre características específicas
❌ NO preguntar sobre estaciones, hemisferios, o conceptos avanzados
❌ NO incluir cálculos, fechas, o relaciones complejas

EJEMPLOS CORRECTOS PARA NIVEL 1:
✅ "¿Cuál de estos es un Mes?" → Opciones: "Enero, Febrero, Lunes, Martes"
✅ "¿Cuál de estos es un Color?" → Opciones: "Rojo, Azul, Piano, Guitarra"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Identificación básica con distractores del mismo dominio."
            elif user_level == 2:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Principiante - Conocimiento Básico Simple)
El usuario está en nivel {user_level}, con conocimiento muy básico.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas sobre conocimiento básico directo y simple
- Ejemplo: "¿Cuál es el primer mes del año?" o "¿Cuántos días tiene la semana?" (números muy básicos: 1, 2, 3, 7, 12)
- Respuestas directas y simples del contenido fundamental
- Pueden incluir números básicos (1, 2, 3, 7, 12) pero SOLO para contar o identificar el primero/último
- NO incluir relaciones complejas, condiciones, o conceptos avanzados

PROHIBIDO ABSOLUTAMENTE PARA NIVEL 2:
❌ NO preguntar sobre estaciones, hemisferios, o conceptos geográficos avanzados
❌ NO preguntar sobre características específicas (ej: "¿Qué mes no tiene día 30?")
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")
❌ NO preguntar sobre relaciones entre conceptos (ej: "¿En qué estación está Mayo?")
❌ NO incluir cálculos complejos o fechas específicas
❌ NO preguntar sobre detalles, excepciones, o casos especiales

EJEMPLOS CORRECTOS PARA NIVEL 2:
✅ "¿Cuál es el primer mes del año?" → Opciones: "Enero, Febrero, Marzo, Abril"
✅ "¿Cuántos meses tiene un año?" → Opciones: "10, 11, 12, 13"
✅ "¿Cuál es el último mes del año?" → Opciones: "Octubre, Noviembre, Diciembre, Enero"

EJEMPLOS INCORRECTOS (DEMASIADO COMPLEJOS):
❌ "¿En qué estación está Mayo en el hemisferio norte?" (requiere conocimiento de estaciones y hemisferios)
❌ "¿Qué mes no tiene día 30?" (requiere conocimiento de características específicas)
❌ "¿Cuántos días tiene Febrero en un año bisiesto?" (requiere conocimiento de años bisiestos)
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Conocimiento básico simple. Solo números básicos (1-12) para contar o identificar primero/último. PROHIBIDO: estaciones, hemisferios, características específicas, o relaciones complejas."
            elif user_level == 3:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Principiante-Intermedio - Conocimiento con Números)
El usuario está en nivel {user_level}, con conocimiento básico.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren conocimiento de orden, posición o números básicos
- Ejemplo: "¿Cuál es el séptimo mes del año?" o "¿En qué posición está [concepto]?" (contar en secuencia)
- Requieren contar o conocer el orden básico de una secuencia simple
- Las opciones deben incluir números o posiciones
- Aplicación directa de conocimiento básico con números
- Pueden incluir números hasta 12 o 31 (días del mes)

PROHIBIDO PARA NIVEL 3:
❌ NO preguntar sobre estaciones, hemisferios, o conceptos geográficos avanzados
❌ NO preguntar sobre características específicas complejas (ej: "¿Qué mes no tiene día 30?")
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")
❌ NO preguntar sobre relaciones entre conceptos diferentes (ej: "¿En qué estación está Mayo?")

EJEMPLOS CORRECTOS PARA NIVEL 3:
✅ "¿Cuál es el séptimo mes del año?" → Opciones: "Julio, Junio, Agosto, Septiembre"
✅ "¿En qué posición está Mayo en el año?" → Opciones: "Quinta, Sexta, Séptima, Octava"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Conocimiento con números, orden o posición básica. Contar en secuencias simples. PROHIBIDO: estaciones, hemisferios, características complejas."
            elif user_level == 4:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Intermedio Básico - Aplicación Simple)
El usuario está en nivel {user_level}, con conocimiento intermedio básico.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren aplicación simple de conocimiento básico
- Combinar dos conceptos básicos relacionados
- Ejemplo: "¿Qué mes tiene 31 días?" o "¿Cuál mes NO tiene 31 días?" (características básicas y simples)
- Requieren conocer características básicas y aplicarlas
- Pueden incluir características simples y directas (número de días, nombre, etc.)

PROHIBIDO PARA NIVEL 4:
❌ NO preguntar sobre estaciones, hemisferios, o conceptos geográficos avanzados
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")
❌ NO preguntar sobre relaciones complejas entre conceptos diferentes

EJEMPLOS CORRECTOS PARA NIVEL 4:
✅ "¿Qué mes tiene 31 días?" → Opciones: "Enero, Febrero, Abril, Junio"
✅ "¿Cuál mes NO tiene 31 días?" → Opciones: "Enero, Febrero, Marzo, Mayo"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Aplicación simple de conocimiento. Combinar conceptos básicos con características simples. PROHIBIDO: estaciones, hemisferios, condiciones complejas."
            elif user_level == 5:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Intermedio - Aplicación con Excepciones)
El usuario está en nivel {user_level}, con conocimiento intermedio.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas sobre excepciones o casos especiales básicos
- Ejemplo: "¿Qué mes NO tiene día 30?" o "¿Cuál es la excepción a [regla básica]?"
- Requieren conocer reglas generales y sus excepciones básicas
- Aplicación de conocimiento con casos especiales simples

PERMITIDO PARA NIVEL 5:
✅ Preguntar sobre características específicas y excepciones básicas
✅ Preguntar sobre casos especiales simples (ej: "¿Qué mes no tiene día 30?")

PROHIBIDO PARA NIVEL 5:
❌ NO preguntar sobre estaciones, hemisferios, o conceptos geográficos avanzados (aún no)
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")

EJEMPLOS CORRECTOS PARA NIVEL 5:
✅ "¿Qué mes no tiene día 30?" → Opciones: "Enero, Febrero, Marzo, Abril"
✅ "¿Cuál mes tiene menos días?" → Opciones: "Enero, Febrero, Marzo, Abril"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Aplicación con excepciones básicas. Conocer reglas y casos especiales simples. PROHIBIDO: estaciones, hemisferios, condiciones con años."
            elif user_level == 6:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Intermedio-Avanzado - Conocimiento de Detalles)
El usuario está en nivel {user_level}, con conocimiento intermedio-avanzado.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas sobre detalles específicos y características particulares
- Ejemplo: "¿Qué mes no tiene día 30?" o "¿Cuál mes tiene [característica única]?"
- Requieren conocimiento de detalles y particularidades
- Aplicación de conocimiento sobre características específicas
- Pueden incluir comparaciones o diferencias sutiles
- Pueden incluir conocimiento básico sobre estaciones o conceptos relacionados (pero no hemisferios aún)

PERMITIDO PARA NIVEL 6:
✅ Preguntar sobre características específicas y detalles
✅ Preguntar sobre conocimiento básico de estaciones (pero sin hemisferios)

PROHIBIDO PARA NIVEL 6:
❌ NO preguntar sobre hemisferios o conceptos geográficos avanzados
❌ NO preguntar sobre condiciones o años (ej: "En el año 1992, ¿Febrero tiene día 29?")

EJEMPLOS CORRECTOS PARA NIVEL 6:
✅ "¿Qué mes no tiene día 30?" → Opciones: "Enero, Febrero, Marzo, Abril"
✅ "¿En qué estación está Mayo?" (sin mencionar hemisferio) → Opciones: "Primavera, Verano, Otoño, Invierno"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Conocimiento de detalles específicos. Características particulares. Puede incluir estaciones básicas. PROHIBIDO: hemisferios, condiciones con años."
            elif user_level == 7:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Avanzado Básico - Aplicación Contextual)
El usuario está en nivel {user_level}, con conocimiento avanzado básico.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren aplicar conocimiento en un contexto específico
- Ejemplo: "¿En qué estación está Mayo en el hemisferio norte?" o "Dado [contexto], ¿cuál es [respuesta]?"
- Requieren análisis de contexto y aplicación de reglas
- Combinar múltiples conceptos en un escenario (estaciones + hemisferios)
- Pueden incluir conocimiento de hemisferios y estaciones

PERMITIDO PARA NIVEL 7:
✅ Preguntar sobre estaciones y hemisferios
✅ Preguntar sobre relaciones entre conceptos diferentes
✅ Aplicar conocimiento en contextos específicos

EJEMPLOS CORRECTOS PARA NIVEL 7:
✅ "¿En qué estación está Mayo en el hemisferio norte?" → Opciones: "Primavera, Verano, Otoño, Invierno"
✅ "¿En qué estación está Diciembre en el hemisferio sur?" → Opciones: "Primavera, Verano, Otoño, Invierno"
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Aplicación contextual. Puede incluir estaciones, hemisferios, y relaciones entre conceptos."
            elif user_level == 8:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Avanzado - Aplicación con Condiciones)
El usuario está en nivel {user_level}.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren aplicar conocimiento con condiciones específicas
- Ejemplo: "En el año [año específico], ¿[concepto] tiene [característica]? Sí/No" o "Si [condición], entonces ¿[pregunta]?"
- Requieren análisis de condiciones y aplicación de reglas complejas
- Pueden incluir cálculos o verificaciones basadas en condiciones
- Aplicación de conocimiento avanzado con variables o condiciones
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Aplicación con condiciones. Análisis de situaciones con variables específicas."
            elif user_level == 9:
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Experto - Conocimiento Profundo)
El usuario está en nivel {user_level}.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren conocimiento profundo y especializado
- Ejemplo: "¿Cuál es la relación entre [concepto avanzado] y [otro concepto avanzado]?" o "¿Cómo afecta [factor complejo] a [concepto]?"
- Requieren comprensión de relaciones complejas y matices
- Pueden incluir casos edge, optimizaciones, o implementaciones avanzadas
- Pensamiento crítico y análisis de escenarios complejos
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Conocimiento profundo. Relaciones complejas y casos avanzados."
            else:  # user_level == 10
                level_adjustment_note = f"""
📊 NIVEL DEL USUARIO: {user_level}/10 (Experto Total - Dominio Completo)
El usuario está en nivel {user_level}, domina el tema completamente.

INSTRUCCIONES ESPECÍFICAS PARA PREGUNTAS DE NIVEL {user_level}:
- Preguntas que requieren dominio experto y conocimiento especializado avanzado
- Ejemplo: "En [contexto avanzado específico], ¿cuándo/cómo/dónde [pregunta compleja]?" o "¿Cuál es la implicación de [concepto avanzado] en [situación compleja]?"
- Requieren conocimiento de detalles muy específicos, casos edge, y excepciones avanzadas
- Pueden incluir preguntas sobre optimizaciones, arquitectura avanzada, o casos de uso especializados
- Pensamiento crítico, análisis profundo, y síntesis de múltiples conceptos avanzados
- Preguntas sobre matices, implicaciones, y conocimientos profundos del tema
- Pueden requerir conocimiento de contexto geográfico, histórico, o técnico avanzado
"""
                difficulty_instructions = f"Preguntas de NIVEL {user_level}/10: Dominio experto. Conocimiento especializado avanzado, casos edge, y análisis profundo."
            
            # Usar el nivel directamente en lugar de mapear a easy/medium/hard
            level_adjustment_note += f"""

🚨🚨🚨 REGLA CRÍTICA - NO NEGOCIABLE 🚨🚨🚨:
Las preguntas DEBEN reflejar EXACTAMENTE el nivel {user_level}/10.

- Si el usuario está en nivel 0-2: SOLO preguntas de identificación básica. PROHIBIDO: estaciones, hemisferios, características específicas, relaciones complejas.
- Si el usuario está en nivel 3-4: Puedes incluir números básicos y orden simple. PROHIBIDO: estaciones, hemisferios, condiciones complejas.
- Si el usuario está en nivel 5-6: Puedes incluir características específicas y estaciones básicas. PROHIBIDO: hemisferios, condiciones con años.
- Si el usuario está en nivel 7+: Puedes incluir estaciones, hemisferios, y relaciones complejas.

NO uses preguntas de nivel más alto que {user_level}/10. Si tienes dudas, usa una pregunta más simple.
Revisa cada pregunta antes de incluirla: ¿Es apropiada para nivel {user_level}/10? Si no, simplifícala o cámbiala."""
        
        # Preparar variables para el template (evaluar expresiones antes de pasarlas al template)
        user_level_display = str(user_level) if user_level is not None else "No especificado"
        
        if user_level is None:
            # Si no hay nivel del usuario, usar dificultad estándar
            level_adjustment_note = "\n\n📊 No se detectó nivel del usuario. Se usará la dificultad estándar."
            difficulty_instructions_dict = {
                "easy": "Preguntas básicas que evalúan comprensión fundamental.",
                "medium": "Preguntas que requieren comprensión y aplicación de conceptos.",
                "hard": "Preguntas complejas que requieren análisis avanzado."
            }
            difficulty_instructions = difficulty_instructions_dict.get(difficulty, "Preguntas de nivel intermedio.")
        
        # Preparar difficulty_instructions_display
        if isinstance(difficulty_instructions, str):
            difficulty_instructions_display = difficulty_instructions
        elif isinstance(difficulty_instructions, dict):
            difficulty_instructions_display = f"- Instrucciones de dificultad: {difficulty_instructions.get(difficulty, difficulty_instructions.get('medium', 'Nivel intermedio'))}"
        else:
            difficulty_instructions_display = f"- Instrucciones de dificultad: {str(difficulty_instructions)}"
        
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
- Nivel del usuario: {user_level_display}/10
- Dificultad base solicitada: {difficulty}
{difficulty_instructions_display}
{level_adjustment_note}

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
                "user_level_display": user_level_display,
                "difficulty_instructions_display": difficulty_instructions_display,
                "level_adjustment_note": level_adjustment_note if level_adjustment_note else ""
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
