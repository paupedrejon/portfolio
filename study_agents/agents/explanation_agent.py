"""
Explanation Agent - Transforma información en explicaciones claras y resumidas
Genera apuntes estructurados del contenido procesado
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
import tiktoken
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

class ExplanationAgent:
    """
    Agente especializado en generar explicaciones claras y resumidas
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente de explicaciones
        
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
                print("🤖 Explanation Agent inicializado con ModelManager (modo automático)")
            except Exception as e:
                print(f"⚠️ Warning: No se pudo inicializar ModelManager: {e}")
                self.model_manager = None
        else:
            # Fallback a OpenAI directo
            if self.api_key:
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",  # Usar modelo más barato por defecto
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                    print("🤖 Explanation Agent inicializado (sin ModelManager, usando gpt-3.5-turbo)")
                except Exception as e:
                    print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
            else:
                print("⚠️ Explanation Agent inicializado sin API key (se requerirá para usar)")
    
    def generate_explanations(self, max_concepts: int = 20) -> Dict[str, str]:
        """
        Genera explicaciones claras del contenido procesado
        
        Args:
            max_concepts: Número máximo de conceptos a explicar
            
        Returns:
            Diccionario con explicaciones por concepto o texto completo
        """
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Para generación de explicaciones, necesitamos contexto amplio
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    context_length=8000  # Necesitamos contexto amplio
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
                            temperature=0.7,
                            api_key=self.api_key,
                            max_tokens=None
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return {
                            "error": f"Error al inicializar el modelo: {str(e2)}",
                            "status": "error"
                        }
                else:
                    return {
                        "error": "Se requiere configurar una API key de OpenAI o tener Ollama instalado.",
                        "status": "error"
                    }
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return {
                    "error": "Se requiere configurar una API key de OpenAI para generar explicaciones.",
                    "status": "error"
                }
            
            # Inicializar LLM si no está inicializado
            if not self.llm:
                try:
                    # Usar gpt-3.5-turbo (más barato) en lugar de gpt-4-turbo
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except Exception as e:
                    return {
                        "error": f"Error al inicializar el modelo: {str(e)}",
                        "status": "error"
                    }
        
        # Recuperar todo el contenido de la memoria
        all_content = self.memory.get_all_documents(limit=100)
        
        if not all_content:
            return {"error": "No hay contenido procesado. Sube documentos primero."}
        
        # Combinar contenido en chunks más grandes
        combined_content = "\n\n---\n\n".join(all_content[:max_concepts * 2])
        
        # Generar explicaciones estructuradas
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", """Eres un profesor experto que explica conceptos de manera clara y sencilla.
            Tu tarea es transformar información compleja en explicaciones fáciles de entender.
            Mantén un tono educativo y amigable.
            Organiza la información de manera estructurada y lógica."""),
            ("user", """Transforma el siguiente contenido educativo en explicaciones claras y estructuradas.

CONTENIDO:
{content}

Genera un documento de apuntes que incluya:
1. **Resumen Ejecutivo**: Un resumen breve de los conceptos principales
2. **Conceptos Clave**: Explicación clara de cada concepto importante
3. **Ejemplos Prácticos**: Ejemplos que ayuden a entender los conceptos
4. **Relaciones entre Conceptos**: Cómo se relacionan los diferentes temas
5. **Puntos Importantes a Recordar**: Lista de los puntos más relevantes

Formato el resultado en Markdown con encabezados, listas y secciones bien organizadas.""")
        ])
        
        try:
            chain = prompt_template | self.llm
            explanation = chain.invoke({"content": combined_content})
            
            return {
                "explanations": explanation.content,
                "status": "success",
                "concepts_covered": len(all_content)
            }
        except Exception as e:
            return {
                "error": f"Error al generar explicaciones: {str(e)}",
                "status": "error"
            }
    
    def generate_notes(self, topics: Optional[List[str]] = None, model: Optional[str] = None, user_level: Optional[int] = None, conversation_history: Optional[List[dict]] = None, topic: Optional[str] = None) -> str:
        """
        Genera resumen completo de la conversación en formato Markdown
        
        Args:
            topics: Lista de temas específicos a cubrir (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            user_level: Nivel del usuario en el tema (1-10, opcional)
            conversation_history: Historial de conversación para generar resumen actualizado (opcional)
            
        Returns:
            Resumen en formato Markdown
        """
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Para generación de apuntes, necesitamos contexto amplio y buena calidad
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    preferred_model=model if model else None,
                    context_length=8000  # Necesitamos contexto amplio
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
                            temperature=0.7,
                            api_key=self.api_key,
                            max_tokens=None
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}"
                else:
                    return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI o tener Ollama instalado. Por favor, configura tu API key o instala Ollama."
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI para generar apuntes. Por favor, configura tu API key."
            
            # Usar modelo especificado o el más barato disponible
            model_to_use = model if model else "gpt-3.5-turbo"  # Por defecto usar el más barato
            
            try:
                self.llm = ChatOpenAI(
                    model=model_to_use,
                    temperature=0.7,
                    api_key=self.api_key,
                    max_tokens=None
                )
            except Exception as e:
                # Si el modelo especificado falla, intentar con gpt-3.5-turbo como fallback
                try:
                    print(f"⚠️ Modelo {model_to_use} no disponible, usando gpt-3.5-turbo como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except Exception as e2:
                    return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}"
        
        # Definir el prompt template que se usará en ambos casos
        # Usar raw string (r"""...""") para evitar problemas con secuencias de escape
        prompt_template = r"""Eres un Arquitecto de Conocimiento experto en crear 'Hojas de Estudio de Alto Rendimiento'.

Tu objetivo NO es resumir, sino destilar la información para que sea memorizable al instante.

CONTENIDO FUENTE:
{content}

---

### 🧠 REGLAS DE ORO (STYLE GUIDE):

1. **CERO RELLENO:** Prohibido usar frases introductorias como "En este documento...", "A continuación...", "Es importante notar que...". Ve directo al dato.

2. **FORMATO ATÓMICO:** Usa Bullet points (•) para todo. Párrafos de máximo 2 líneas.

3. **VISUAL:** Usa **Negritas** para conceptos clave y `código` para términos técnicos.

4. **NO MERMAID:** Absolutamente prohibido usar bloques ```mermaid. Si necesitas un diagrama, usa SOLO el formato JSON especificado abajo.

### 📊 ADAPTACIÓN AL NIVEL (CRÍTICO):

El nivel del estudiante está indicado en {level_note}. **ADÁPTATE ESTRICTAMENTE AL NIVEL**:

**NIVEL 0-1 (Principiante Absoluto):**
- Solo vocabulario esencial: saludos, números 1-10, colores básicos
- Frases de supervivencia: "Hola", "Adiós", "Gracias", "¿Cómo estás?"
- Pronunciación básica explicada con letras
- Sin gramática compleja, solo estructuras simples
- Ejemplos muy simples y comunes

**NIVEL 2-3 (Principiante):**
- Vocabulario cotidiano: días de la semana, meses, familia, comida básica
- Frases simples: "Me llamo...", "Tengo hambre", "¿Cuánto cuesta?"
- Gramática básica: presente simple, artículos básicos
- Pronunciación con guías fonéticas simples
- Ejemplos prácticos de uso diario

**NIVEL 4-5 (Intermedio Básico):**
- Vocabulario temático: trabajo, viajes, hobbies, emociones
- Tiempos verbales: presente, pasado simple, futuro cercano
- Estructuras complejas básicas: condicionales simples, comparativos
- Frases útiles para situaciones comunes
- Ejemplos contextualizados

**NIVEL 6-7 (Intermedio):**
- Vocabulario avanzado temático: negocios, tecnología, cultura
- Tiempos verbales complejos: subjuntivo, condicional, perfecto
- Expresiones idiomáticas comunes
- Gramática avanzada: voz pasiva, construcciones impersonales
- Diferencias regionales básicas
- Ejemplos de uso formal e informal

**NIVEL 8-9 (Avanzado):**
- Vocabulario sofisticado: términos académicos, literarios, técnicos
- Tiempos verbales avanzados: pluscuamperfecto, subjuntivo complejo
- Expresiones idiomáticas raras y cultas
- Gramática compleja: perífrasis, construcciones estilísticas
- Diferencias regionales detalladas (dialectos, acentos)
- Matices y sutilezas del idioma
- Ejemplos de literatura o discursos formales

**NIVEL 10 (Experto):**
- Vocabulario arcaico, literario o extremadamente específico
- Construcciones gramaticales raras o poco comunes
- Expresiones idiomáticas obsoletas o regionales muy específicas
- Excepciones y casos especiales
- Variaciones dialectales y sociolectales
- Referencias culturales y históricas
- Uso estilístico avanzado y figuras retóricas
- Ejemplos de textos clásicos o académicos especializados

### 📐 ESTRUCTURA DE SALIDA OBLIGATORIA:

# {topic_name}

## ⚡ Conceptos Blitz (Lo esencial)
*Lista rápida de definiciones clave. Formato: **Concepto**: Definición ultra-corta.*

## 📚 Núcleo del Conocimiento
*Organiza el contenido por subtemas. Usa tablas siempre que sea posible para comparar.*

*Si es IDIOMAS (ADÁPTATE AL NIVEL):*
- **Nivel 0-3**: Tablas simples: | Palabra | Traducción | Pronunciación (letras) |
- **Nivel 4-6**: Tablas ampliadas: | Vocabulario | Traducción | Contexto/Ejemplo | Notas |
- **Nivel 7-9**: Tablas avanzadas: | Término | Traducción Literal | Uso | Contexto Formal/Informal | Variaciones Regionales |
- **Nivel 10**: Tablas expertas: | Término | Etimo | Uso Arcaico/Moderno | Variantes Dialectales | Referencias Culturales |

*Si es PROGRAMACIÓN (ADÁPTATE AL NIVEL):*
- **Nivel 0-3**: Código simple con comentarios línea por línea, sin conceptos complejos
- **Nivel 4-6**: Bloques de código con comentarios explicativos y conceptos intermedios
- **Nivel 7-9**: Código avanzado con patrones, mejores prácticas, optimizaciones
- **Nivel 10**: Código experto con arquitecturas complejas, patrones avanzados, casos edge

*Si es TEORÍA:* Usa listas anidadas, adaptando la complejidad al nivel.

## ⚠️ Errores Comunes / Trampas
*Lista de cosas donde los estudiantes suelen fallar o confundirse.*

## 💎 Ejemplo Práctico
*Un caso de uso real, frase completa o snippet de código.*

---

### 🎨 INSTRUCCIONES PARA DIAGRAMAS (JSON ONLY):

Si el contenido se beneficia de una visualización (jerarquías, procesos, comparaciones VS), genera UN bloque de código `diagram-json` al final de la sección correspondiente.

**Plantilla JSON Estricta:**

```diagram-json
{
  "title": "Título del Diagrama",
  "nodes": [
    {"id": "A", "label": "Concepto Central", "color": "#6366f1"},
    {"id": "B", "label": "Subconcepto", "color": "#10b981", "description": "Explicación breve"}
  ],
  "edges": [
    {"from": "A", "to": "B"}
  ]
}
```

**IMPORTANTE**: 
- SOLO genera diagramas para comparaciones directas de DOS elementos (ej: "A vs B")
- NO generes diagramas para vocabulario, frases, estructuras gramaticales, o listas de conceptos
- Si tienes dudas, NO generes diagrama. Usa listas o tablas en su lugar.

{level_note}"""

        # Preparar historial de conversación si está disponible
        conversation_text = ""
        if conversation_history:
            conversation_text = "\n\n=== HISTORIAL DE CONVERSACIÓN ===\n"
            for msg in conversation_history:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                if role == "user":
                    conversation_text += f"\n[ESTUDIANTE]: {content}\n"
                elif role == "assistant":
                    conversation_text += f"\n[PROFESOR]: {content}\n"
            conversation_text += "\n=== FIN DEL HISTORIAL ===\n"
        
        # Usar topic si está disponible y topics no lo está
        final_topics = topics
        if not final_topics and topic:
            final_topics = [topic]
        
        # Determinar si hay historial de conversación relevante al tema
        has_relevant_conversation = False
        if conversation_text and final_topics:
            # Verificar si el historial menciona el tema
            main_topic_lower = final_topics[0].lower() if isinstance(final_topics, list) else str(final_topics).lower()
            if main_topic_lower in conversation_text.lower():
                has_relevant_conversation = True
                print(f"📝 Historial de conversación contiene información sobre '{final_topics[0]}'")
        
        if final_topics:
            # Si hay historial relevante, usarlo primero
            if has_relevant_conversation:
                combined_content = conversation_text
                print(f"📝 Usando historial de conversación sobre '{final_topics[0]}'")
            else:
                # Si no hay historial relevante pero hay tema, generar desde cero
                # NO buscar en documentos genéricos que pueden no ser relevantes
                if conversation_text:
                    # Si hay historial pero no es relevante, aún así incluirlo pero priorizar el tema
                    print(f"📝 Historial de conversación no es relevante para '{final_topics[0]}', generando desde cero con el tema")
                else:
                    print(f"📝 No hay historial de conversación, generando apuntes educativos desde cero para '{final_topics[0]}'")
                
                main_topic = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
                combined_content = f"TEMA: {main_topic}\n\nEste resumen se generará basándose en el conocimiento educativo sobre {main_topic}, adaptado al nivel del estudiante."
                
                # Si hay historial no relevante, añadirlo al final pero con menor prioridad
                if conversation_text:
                    combined_content += f"\n\n---\n\nHISTORIAL DE CONVERSACIÓN (contexto adicional):\n{conversation_text}"
        else:
            # Obtener contenido pero limitar usando conteo real de tokens
            all_content = self.memory.get_all_documents(limit=100)  # Aumentar límite para obtener más contenido
            
            # Si hay historial de conversación pero no hay documentos, usar solo el historial
            if conversation_text and (not all_content or len(all_content) == 0):
                print("📝 Usando solo historial de conversación (no hay documentos)")
                combined_content = conversation_text
            elif not all_content or len(all_content) == 0:
                # Si no hay historial ni documentos
                if not conversation_text:
                    print("❌ No hay documentos en la memoria ni historial de conversación")
                    return "# Resumen\n\n⚠️ No hay contenido disponible. Por favor, sube documentos o inicia una conversación primero."
                else:
                    combined_content = conversation_text
            else:
                # Filtrar documentos vacíos o muy cortos
                all_content = [doc for doc in all_content if doc and doc.strip() and len(doc.strip()) > 10]
                
                if not all_content or len(all_content) == 0:
                    # Si no hay documentos válidos pero hay historial, usar solo historial
                    if conversation_text:
                        print("📝 Usando solo historial de conversación (documentos vacíos)")
                        combined_content = conversation_text
                    else:
                        print("❌ Todos los documentos están vacíos o son muy cortos")
                        return "# Resumen\n\n⚠️ Los documentos procesados no contienen suficiente contenido. Por favor, sube documentos con más texto."
                else:
                    print(f"📄 Encontrados {len(all_content)} documentos con contenido válido")
                    print(f"📄 Primer documento (primeros 200 chars): {all_content[0][:200]}...")
                    
                    # Calcular tokens usando tiktoken para asegurar que no excedemos el límite
                    try:
                        encoding = tiktoken.encoding_for_model("gpt-4")
                    except:
                        encoding = tiktoken.get_encoding("cl100k_base")
                    
                    # Aumentar límite de tokens ya que estamos usando gpt-4-turbo o gpt-4o que tienen más contexto
                    MAX_CONTENT_TOKENS = 8000  # Aumentado para modelos con más contexto
                    combined_content = ""
                    combined_tokens = 0
                    
                    # Calcular tokens del prompt base (sin contenido)
                    prompt_base_tokens = len(encoding.encode(prompt_template.replace("{content}", "")))
                    print(f"📊 Tokens del prompt base: {prompt_base_tokens}")
                    print(f"📊 Límite de tokens para contenido: {MAX_CONTENT_TOKENS}")
                    
                    # Añadir historial primero si está disponible (tiene prioridad)
                    if conversation_text:
                        hist_tokens = len(encoding.encode(conversation_text))
                        if hist_tokens + prompt_base_tokens <= MAX_CONTENT_TOKENS:
                            combined_content = conversation_text
                            combined_tokens = hist_tokens
                            print(f"📝 Historial añadido ({hist_tokens} tokens)")
                    
                    for i, doc in enumerate(all_content):
                        doc_text = f"\n\n---\n\n{doc}" if combined_content else doc
                        doc_tokens = len(encoding.encode(doc_text))
                        
                        # Verificar si añadir este documento excedería el límite
                        if combined_tokens + doc_tokens + prompt_base_tokens > MAX_CONTENT_TOKENS:
                            print(f"📊 Límite alcanzado después de {i} documentos ({combined_tokens} tokens)")
                            # Añadir nota de que hay más contenido
                            combined_content += f"\n\n---\n\n[Nota: Hay más contenido disponible. Se han incluido {i} documentos de {len(all_content)} disponibles. Para ver todo, puedes hacer preguntas específicas sobre temas concretos.]"
                            break
                        combined_content += doc_text
                        combined_tokens += doc_tokens
                        print(f"📄 Documento {i+1} añadido ({doc_tokens} tokens, total: {combined_tokens})")
                    
                    print(f"📊 Contenido final: {combined_tokens} tokens, {len(combined_content)} caracteres")
        
        # Si no hay contenido ni temas, retornar error
        if not combined_content or not combined_content.strip():
            return "# Resumen\n\n⚠️ No hay contenido disponible. Por favor, sube documentos, inicia una conversación, o especifica un tema."
        
        # Verificar que el contenido no esté vacío después de limpiar
        # Si tiene "TEMA:" al inicio, es contenido generado desde cero, así que permitirlo aunque sea corto
        if len(combined_content.strip()) < 50 and not combined_content.strip().startswith("TEMA:"):
            return "# Resumen\n\n⚠️ El contenido disponible es demasiado corto o está vacío. Por favor, sube documentos con más contenido o inicia una conversación."
        
        # Añadir validación: mostrar una muestra del contenido para debugging
        print(f"✅ Generando apuntes con {len(combined_content)} caracteres de contenido")
        print(f"📄 Primeros 500 caracteres: {combined_content[:500]}...")
        print(f"📄 Últimos 200 caracteres: {combined_content[-200:]}...")
        
        # Validar que el contenido tiene información real (no solo espacios o caracteres especiales)
        # Si tiene "TEMA:" al inicio, es contenido generado desde cero, así que permitirlo
        if not combined_content.strip().startswith("TEMA:"):
            content_words = combined_content.split()
            if len(content_words) < 10:
                print(f"❌ Contenido tiene muy pocas palabras: {len(content_words)}")
                return "# Resumen\n\n⚠️ El contenido disponible tiene muy pocas palabras. Por favor, sube documentos con más texto."
        
        # Validar palabras solo si no es contenido generado desde cero
        if not combined_content.strip().startswith("TEMA:"):
            content_words = combined_content.split()
            print(f"✅ Contenido válido: {len(content_words)} palabras")
        else:
            print(f"✅ Generando contenido educativo desde cero para el tema especificado")
        
        # Preparar nota de nivel si está disponible
        level_note = ""
        if user_level is not None:
            if user_level <= 3:
                level_note = "\n\n**NIVEL DEL ESTUDIANTE**: Principiante (nivel {}/10). Adapta el contenido para que sea claro y accesible, usando lenguaje simple y explicaciones detalladas.".format(user_level)
            elif user_level <= 6:
                level_note = "\n\n**NIVEL DEL ESTUDIANTE**: Intermedio (nivel {}/10). Puedes usar terminología técnica pero siempre con explicaciones claras.".format(user_level)
            else:
                level_note = "\n\n**NIVEL DEL ESTUDIANTE**: Avanzado (nivel {}/10). Puedes usar terminología técnica avanzada y profundizar en los conceptos.".format(user_level)
        
        # Preparar nombre del tema
        topic_name = ""
        if final_topics and len(final_topics) > 0:
            topic_name = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
        elif topic:
            topic_name = topic
        elif combined_content.strip().startswith("TEMA:"):
            # Extraer el tema del contenido generado
            import re
            topic_match = re.search(r'TEMA:\s*(.+)', combined_content)
            if topic_match:
                topic_name = topic_match.group(1).split('\n')[0].strip()
        
        if not topic_name:
            topic_name = "Estudio"
        
        # Usar replace directo en lugar de format para evitar problemas con llaves en el contenido
        # Esto es más seguro cuando el contenido puede contener llaves también
        prompt = prompt_template.replace("{content}", combined_content).replace("{level_note}", level_note).replace("{topic_name}", topic_name)

        try:
            print("🔄 Invocando LLM para generar apuntes...")
            response = self.llm.invoke(prompt)
            notes_content = response.content
            print(f"✅ Respuesta recibida: {len(notes_content)} caracteres")
            print(f"📄 Primeros 300 caracteres: {notes_content[:300]}")
            
            # POST-PROCESAMIENTO: Eliminar cualquier bloque Mermaid que el modelo pueda haber generado
            import re
            # Detectar y eliminar bloques de código Mermaid (multilínea)
            # Patrón mejorado que captura bloques completos con cualquier contenido entre los backticks
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
                notes_content = re.sub(pattern, '', notes_content, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # También eliminar bloques que comiencen directamente con comandos Mermaid (sin backticks iniciales)
            mermaid_code_patterns = [
                r'graph\s+(TB|TD|LR|RL|BT).*?```',
                r'flowchart\s+(TB|TD|LR|RL|BT).*?```',
                r'gantt\s+.*?```',
            ]
            
            for pattern in mermaid_code_patterns:
                notes_content = re.sub(pattern, '', notes_content, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # Limpiar líneas vacías múltiples que puedan quedar después de eliminar bloques
            notes_content = re.sub(r'\n{3,}', '\n\n', notes_content)
            
            # Validar que hay bloques diagram-json en la respuesta
            diagram_json_count = notes_content.count('```diagram-json') + notes_content.count('``` diagram-json')
            if diagram_json_count == 0:
                print("⚠️ Advertencia: No se encontraron bloques diagram-json en la respuesta")
                print(f"📄 Primeros 500 caracteres de la respuesta: {notes_content[:500]}")
            else:
                print(f"✅ Post-procesamiento: Bloques Mermaid eliminados, {diagram_json_count} diagrama(s) JSON encontrado(s)")
            
            # Validar que la respuesta no esté vacía
            if not notes_content or not notes_content.strip():
                return "# Error\n\n⚠️ La respuesta del modelo está vacía. Por favor, intenta de nuevo."
            
            # Validar que la respuesta contenga contenido válido
            if len(notes_content.strip()) < 50:
                return f"# Error\n\n⚠️ La respuesta del modelo es demasiado corta. Respuesta recibida: {notes_content[:200]}"
            
            return notes_content
        except KeyError as e:
            error_str = str(e)
            print(f"❌ KeyError al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            return f"# Error\n\n⚠️ Error al procesar la respuesta: {error_str}. Por favor, intenta de nuevo o verifica que hay contenido disponible."
        except Exception as e:
            error_str = str(e)
            print(f"❌ Error al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            # Si el error es por límite de tokens, sugerir usar menos contenido
            if "context_length" in error_str.lower() or "tokens" in error_str.lower():
                return f"# Error\n\nEl contenido es demasiado extenso. Por favor, intenta generar apuntes sobre temas específicos o divide el documento en partes más pequeñas.\n\nError: {error_str}"
            return f"# Error\n\nNo se pudieron generar los apuntes: {error_str}"
    
    def explain_concept(self, concept: str) -> str:
        """
        Explica un concepto específico
        
        Args:
            concept: Concepto a explicar
            
        Returns:
            Explicación del concepto
        """
        # Verificar API key
        if not self.api_key:
            return f"# Concepto: {concept}\n\n⚠️ Se requiere configurar una API key de OpenAI para explicar conceptos."
        
        # Inicializar LLM si no está inicializado
        if not self.llm:
            try:
                # Usar gpt-4-turbo que tiene 128k tokens de contexto (más reciente y estable)
                # Si no está disponible, usar gpt-4o que también tiene contexto amplio
                try:
                    self.llm = ChatOpenAI(
                        model="gpt-4-turbo",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except:
                    # Fallback a gpt-4o si gpt-4-turbo no está disponible
                    self.llm = ChatOpenAI(
                        model="gpt-4o",
                        temperature=0.7,
                        api_key=self.api_key,
                        max_tokens=None
                    )
            except Exception as e:
                return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e)}"
        
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=5)
        
        if not relevant_content:
            return f"# Concepto: {concept}\n\nNo se encontró información sobre '{concept}' en los documentos procesados. Por favor, asegúrate de haber subido documentos que contengan este concepto."
        
        prompt = f"""Explica el concepto '{concept}' de manera clara y completa basándote en el siguiente contenido:

{chr(10).join(relevant_content)}

Proporciona:
1. Definición clara
2. Explicación detallada
3. Ejemplos prácticos
4. Relación con otros conceptos
5. Puntos importantes a recordar

Formato en Markdown."""

        try:
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            return f"Error al explicar el concepto: {str(e)}"
