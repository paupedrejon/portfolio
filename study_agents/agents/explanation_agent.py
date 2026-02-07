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
import requests
import re
import requests
import re

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
        self.unsplash_api_key = os.getenv("UNSPLASH_API_KEY")  # Opcional: API key de Unsplash
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY")  # Opcional: API key de YouTube
        
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
    
    def search_image(self, query: str) -> Optional[Dict[str, str]]:
        """
        Busca una imagen relevante usando Unsplash API o fallback a Pexels
        
        Args:
            query: Término de búsqueda para la imagen
            
        Returns:
            Diccionario con url, description, o None si no se encuentra
        """
        try:
            # Intentar con Unsplash primero (si hay API key)
            if self.unsplash_api_key:
                try:
                    search_url = "https://api.unsplash.com/search/photos"
                    params = {
                        "query": query,
                        "per_page": 1,
                        "orientation": "landscape",
                        "client_id": self.unsplash_api_key,
                    }
                    
                    response = requests.get(search_url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get("results") and len(data["results"]) > 0:
                        photo = data["results"][0]
                        image_url = photo["urls"]["regular"]
                        description = photo.get("description") or photo.get("alt_description") or query
                        return {
                            "url": image_url,
                            "description": description,
                            "source": "Unsplash",
                        }
                except Exception as e:
                    print(f"⚠️ Error usando Unsplash API: {e}, intentando Pexels")
            
            # Fallback a Pexels
            try:
                search_url = "https://api.pexels.com/v1/search"
                headers = {}
                if os.getenv("PEXELS_API_KEY"):
                    headers["Authorization"] = os.getenv("PEXELS_API_KEY")
                params = {
                    "query": query,
                    "per_page": 1,
                    "orientation": "landscape",
                }
                
                response = requests.get(search_url, headers=headers if headers else None, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if data.get("photos") and len(data["photos"]) > 0:
                    photo = data["photos"][0]
                    image_url = photo["src"]["large"]
                    description = photo.get("alt") or query
                    return {
                        "url": image_url,
                        "description": description,
                        "source": "Pexels",
                    }
            except Exception as e:
                print(f"⚠️ Error usando Pexels API: {e}")
            
            return None
            
        except Exception as e:
            print(f"⚠️ Error buscando imagen: {e}")
            return None
    
    def search_youtube_video(self, query: str) -> Optional[Dict[str, str]]:
        """
        Busca un video relevante de YouTube usando la API o web scraping
        
        Args:
            query: Término de búsqueda para el video
            
        Returns:
            Diccionario con videoId, title, description, o None si no se encuentra
        """
        try:
            # Intentar con YouTube Data API v3 si hay API key
            if self.youtube_api_key:
                try:
                    search_url = "https://www.googleapis.com/youtube/v3/search"
                    params = {
                        "part": "snippet",
                        "q": query,
                        "type": "video",
                        "maxResults": 5,
                        "key": self.youtube_api_key,
                        "videoCategoryId": "27",  # Educación
                        "order": "relevance",
                    }
                    
                    response = requests.get(search_url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get("items") and len(data["items"]) > 0:
                        # Buscar el video más relevante
                        best_video = None
                        best_score = 0
                        
                        query_lower = query.lower()
                        educational_keywords = ["explicación", "tutorial", "educativo", "aprender", "curso", "lección", "explicar", "cómo"]
                        has_educational = any(keyword in query_lower for keyword in educational_keywords)
                        
                        for item in data["items"]:
                            snippet = item.get("snippet", {})
                            title = snippet.get("title", "").lower()
                            description = snippet.get("description", "").lower()
                            
                            # Calcular score de relevancia
                            score = 0
                            query_words = query_lower.split()
                            
                            # Puntos por palabras coincidentes en el título
                            for word in query_words:
                                if word in title:
                                    score += 3
                                if word in description:
                                    score += 1
                            
                            # Bonus si tiene términos educativos (si no los tiene la query)
                            if not has_educational:
                                if any(keyword in title or keyword in description for keyword in educational_keywords):
                                    score += 2
                            
                            if score > best_score:
                                best_score = score
                                best_video = item
                        
                        if best_video:
                            video_id = best_video["id"]["videoId"]
                            snippet = best_video.get("snippet", {})
                            return {
                                "videoId": video_id,
                                "title": snippet.get("title", ""),
                                "description": snippet.get("description", ""),
                                "url": f"https://www.youtube.com/watch?v={video_id}",
                            }
                except Exception as e:
                    print(f"⚠️ Error usando YouTube API: {e}, intentando web scraping")
            
            # Fallback: web scraping básico (sin API key)
            try:
                search_url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                response = requests.get(search_url, headers=headers, timeout=10)
                response.raise_for_status()
                
                # Buscar video ID en el HTML (método básico)
                # re ya está importado al principio del archivo
                video_id_pattern = r'"videoId":"([a-zA-Z0-9_-]{11})"'
                matches = re.findall(video_id_pattern, response.text)
                
                if matches:
                    video_id = matches[0]
                    return {
                        "videoId": video_id,
                        "title": query,
                        "description": "",
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                    }
            except Exception as e:
                print(f"⚠️ Error usando web scraping de YouTube: {e}")
            
            return None
            
        except Exception as e:
            print(f"⚠️ Error buscando video: {e}")
            return None
    
    def _process_image_blocks(self, content: str) -> str:
        """
        Procesa bloques de imagen en el contenido y los reemplaza con URLs reales
        
        Args:
            content: Contenido con bloques de imagen
            
        Returns:
            Contenido con bloques de imagen reemplazados por markdown de imágenes
        """
        # Patrón para detectar bloques de imagen
        image_block_pattern = r'```image\s*\n(.*?)```'
        
        def replace_image_block(match):
            block_content = match.group(1).strip()
            
            # Extraer query y description del bloque
            query = None
            description = None
            
            for line in block_content.split('\n'):
                if line.startswith('query:'):
                    query = line.replace('query:', '').strip()
                elif line.startswith('description:'):
                    description = line.replace('description:', '').strip()
            
            # Si no hay query, usar la description o el contenido completo
            if not query:
                query = description or block_content
            
            if not query:
                return ""
            
            # Buscar imagen
            image_data = self.search_image(query)
            
            if image_data:
                image_url = image_data["url"]
                image_desc = image_data.get("description", description or query)
                print(f"✅ Imagen encontrada para '{query}': {image_url[:80]}...")
                
                # Reemplazar con markdown de imagen
                return f'\n\n![{image_desc}]({image_url})\n\n*Imagen: {image_desc}*\n\n'
            else:
                print(f"⚠️ No se encontró imagen para '{query}', dejando descripción")
                return f'\n\n*💡 Imagen sugerida: {description or query}*\n\n'
        
        # Reemplazar todos los bloques de imagen
        processed_content = re.sub(image_block_pattern, replace_image_block, content, flags=re.DOTALL | re.IGNORECASE)
        
        return processed_content
    
    def _process_video_blocks(self, content: str) -> str:
        """
        Procesa bloques de video de YouTube en el contenido y los reemplaza con información del video
        
        Args:
            content: Contenido con bloques de video
            
        Returns:
            Contenido con bloques de video reemplazados por información del video
        """
        # Patrón para detectar bloques de video
        video_block_pattern = r'```youtube-video\s*\n(.*?)```'
        
        def replace_video_block(match):
            block_content = match.group(1).strip()
            
            # Extraer query y description del bloque
            query = None
            description = None
            
            for line in block_content.split('\n'):
                if line.startswith('query:'):
                    query = line.replace('query:', '').strip()
                elif line.startswith('description:'):
                    description = line.replace('description:', '').strip()
            
            # Si no hay query, usar la description o el contenido completo
            if not query:
                query = description or block_content
            
            if not query:
                return ""
            
            # Buscar video
            video_data = self.search_youtube_video(query)
            
            if video_data:
                video_id = video_data["videoId"]
                video_title = video_data.get("title", query)
                video_url = video_data.get("url", f"https://www.youtube.com/watch?v={video_id}")
                print(f"✅ Video encontrado para '{query}': {video_id}")
                
                # Reemplazar con formato especial que el frontend puede procesar
                # El frontend detectará este formato y mostrará el visualizador
                return f'\n\n<youtube-video id="{video_id}" url="{video_url}" title="{video_title}" />\n\n'
            else:
                print(f"⚠️ No se encontró video para '{query}', dejando descripción")
                return f'\n\n*🎬 Video sugerido: {description or query}*\n\n'
        
        # Reemplazar todos los bloques de video
        processed_content = re.sub(video_block_pattern, replace_video_block, content, flags=re.DOTALL | re.IGNORECASE)
        
        return processed_content
    
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
    
    def generate_notes(self, topics: Optional[List[str]] = None, model: Optional[str] = None, user_level: Optional[int] = None, conversation_history: Optional[List[dict]] = None, topic: Optional[str] = None, chat_id: Optional[str] = None, user_id: Optional[str] = None, exam_info: Optional[dict] = None, course_context: Optional[dict] = None) -> tuple[str, dict]:
        """
        Genera apuntes completos del tema, orientados a preparación de examen
        
        Args:
            topics: Lista de temas específicos a cubrir (opcional)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            user_level: Nivel del usuario en el tema (1-10, opcional)
            conversation_history: Historial de conversación para generar resumen actualizado (opcional)
            exam_info: Información del examen (fecha, días restantes) (opcional)
            course_context: Contexto del curso (título, temas, subtopics) (opcional)
            
        Returns:
            Apuntes en formato HTML estilizado con estilos inline
        """
        # Asegurar que re esté disponible (ya está importado globalmente, pero esto evita conflictos de scope)
        import re as re_module
        re = re_module  # Alias para evitar problemas de scope
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Para generación de apuntes, necesitamos contexto amplio y buena calidad
                self.current_model_config, base_llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    preferred_model=model if model else None,
                    context_length=8000  # Necesitamos contexto amplio
                )
                # Aumentar temperatura para más variación en los apuntes
                if hasattr(base_llm, 'temperature'):
                    base_llm.temperature = 0.9
                self.llm = base_llm
                print(f"✅ Usando modelo: {self.current_model_config.name} (costo: ${self.current_model_config.cost_per_1k_input:.4f}/{self.current_model_config.cost_per_1k_output:.4f} por 1k tokens)")
            except Exception as e:
                error_msg = f"⚠️ Error al seleccionar modelo automáticamente: {str(e)}"
                print(error_msg)
                # Fallback: intentar con OpenAI si hay API key
                if self.api_key:
                    try:
                        self.llm = ChatOpenAI(
                            model="gpt-3.5-turbo",  # Modelo más barato
                            temperature=0.9,  # Aumentada para más variación
                            api_key=self.api_key,
                            max_tokens=None
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}", {"inputTokens": 0, "outputTokens": 0, "model": None}
                else:
                    return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI o tener Ollama instalado. Por favor, configura tu API key o instala Ollama.", {"inputTokens": 0, "outputTokens": 0, "model": None}
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return "# Error\n\n⚠️ Se requiere configurar una API key de OpenAI para generar apuntes. Por favor, configura tu API key.", {"inputTokens": 0, "outputTokens": 0, "model": None}
            
            # Usar modelo especificado o el más barato disponible
            model_to_use = model if model else "gpt-3.5-turbo"  # Por defecto usar el más barato
            
            try:
                self.llm = ChatOpenAI(
                    model=model_to_use,
                    temperature=0.9,  # Aumentada para más variación en los apuntes
                    api_key=self.api_key,
                    max_tokens=None
                )
            except Exception as e:
                # Si el modelo especificado falla, intentar con gpt-3.5-turbo como fallback
                try:
                    print(f"⚠️ Modelo {model_to_use} no disponible, usando gpt-3.5-turbo como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.9,  # Aumentada para más variación
                        api_key=self.api_key,
                        max_tokens=None
                    )
                except Exception as e2:
                    return f"# Error\n\n⚠️ Error al inicializar el modelo: {str(e2)}", {"inputTokens": 0, "outputTokens": 0, "model": None}
        
        # Definir el prompt template que se usará en ambos casos
        # Usar raw string (r"""...""") para evitar problemas con secuencias de escape
        prompt_template = r"""Eres un tutor experto de una academia que prepara estudiantes para exámenes.

Tu objetivo es crear apuntes completos y naturales que ayuden al estudiante a prepararse para su examen, actuando como una academia profesional que guía paso a paso al estudiante.

**IMPORTANTE - TU ROL COMO ACADEMIA:**
- Actúa como una academia profesional que prepara estudiantes para exámenes
- Lee y comprende bien el contenido del PDF proporcionado
- Crea apuntes naturales y completos, como cualquier LLM moderno lo haría
- Enfócate en explicar cada concepto que entra en el examen de forma clara y completa
- Ayuda al estudiante a entender cada concepto paso a paso
- Prioriza los conceptos clave que entran en el examen
- Si hay información sobre cuánto falta para el examen, adapta el contenido para ayudar al estudiante a prepararse eficientemente

{language_instruction}

CONTENIDO FUENTE:
{content}

---

### 🧠 REGLAS DE ORO (STYLE GUIDE):

1. **CERO RELLENO:** Prohibido usar frases introductorias como "En este documento...", "A continuación...", "Es importante notar que...". Ve directo al dato.

2. **FORMATO ATÓMICO:** Usa Bullet points (•) para todo. Párrafos de máximo 2 líneas.

3. **VISUAL:** Usa HTML con estilos inline. Usa `<strong>` para conceptos clave y `<code>` para términos técnicos, ambos con estilos inline de color.

4. **NO MERMAID:** Absolutamente prohibido usar bloques ```mermaid. Si necesitas un diagrama, usa SOLO el formato JSON especificado abajo.

### 📊 ADAPTACIÓN AL NIVEL (CRÍTICO - OBLIGATORIO):

{level_note}

{level_instruction}

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

### 📐 ESTRUCTURA DE SALIDA OBLIGATORIA (HTML):

**🚨 CRÍTICO: DEBES GENERAR EL CONTENIDO EN FORMATO HTML, NO MARKDOWN**

Genera el contenido usando HTML estilizado y moderno. Usa las siguientes etiquetas HTML:

- `<h1>`, `<h2>`, `<h3>`, `<h4>` para títulos
- `<p>` para párrafos
- `<ul>`, `<ol>`, `<li>` para listas
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` para tablas
- `<strong>`, `<em>`, `<code>`, `<pre>` para énfasis y código
- `<div>` con clases para secciones estilizadas
- `<span>` con clases para elementos inline estilizados
- `<hr>` para separadores visuales
- `<blockquote>` para citas o notas importantes

**ESTILOS INLINE OBLIGATORIOS:**
- Usa estilos inline para colores, espaciado y tipografía
- Colores principales: `#6366f1` (azul), `#10b981` (verde), `#f59e0b` (amarillo), `#ef4444` (rojo)
- Usa `border-bottom`, `padding`, `margin` para separadores y espaciado
- Usa `background-color` con transparencias para destacar secciones
- Usa `border-radius` para bordes redondeados

**ESTRUCTURA HTML OBLIGATORIA:**

```html
<div class="notes-container">
  <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid #6366f1; color: #1f2937;">{topic_name}</h1>
  
  <!-- Explicación natural y completa del tema, como un tutor de academia -->
  <section style="margin-bottom: 3rem;">
    <h2 style="font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e5e7eb; color: #1f2937;">Contenido del Tema</h2>
    <!-- Explica el tema de forma natural, completa y educativa. Organiza por subtemas si es necesario. -->
    <!-- Usa párrafos, listas, tablas según sea apropiado. -->
  </section>

**Si es IDIOMAS (ADÁPTATE AL NIVEL) - USA TABLAS HTML:**
- **Nivel 0-3**: Tablas HTML simples con `<table>`, `<tr>`, `<th>`, `<td>` con estilos inline. Columnas: Palabra | Traducción | Pronunciación
- **Nivel 4-6**: Tablas HTML ampliadas: Vocabulario | Traducción | Contexto/Ejemplo | Notas
- **Nivel 7-9**: Tablas HTML avanzadas: Término | Traducción Literal | Uso | Contexto Formal/Informal | Variaciones Regionales
- **Nivel 10**: Tablas HTML expertas: Término | Etimo | Uso Arcaico/Moderno | Variantes Dialectales | Referencias Culturales

**Si es PROGRAMACIÓN (ADÁPTATE AL NIVEL) - USA CÓDIGO HTML:**
- **Nivel 0-3**: Código simple con `<pre><code>` y comentarios línea por línea, sin conceptos complejos
- **Nivel 4-6**: Bloques de código con `<pre><code>` y comentarios explicativos y conceptos intermedios
- **Nivel 7-9**: Código avanzado con `<pre><code>` y patrones, mejores prácticas, optimizaciones
- **Nivel 10**: Código experto con `<pre><code>` y arquitecturas complejas, patrones avanzados, casos edge

**Si es TEORÍA:** Usa listas HTML anidadas (`<ul>`, `<ol>`, `<li>`), adaptando la complejidad al nivel.

  <section style="margin-bottom: 3rem; padding: 1.5rem; background: rgba(239, 68, 68, 0.05); border-radius: 12px; border-left: 4px solid #ef4444;">
    <h2 style="font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; color: #ef4444;">⚠️ Errores Comunes / Trampas</h2>
    <ul style="list-style: none; padding: 0;">
      <li style="margin-bottom: 0.75rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.8); border-radius: 8px; border-left: 3px solid #ef4444;">
        Lista de cosas donde los estudiantes suelen fallar o confundirse
      </li>
    </ul>
  </section>
  
  <section style="margin-bottom: 3rem; padding: 1.5rem; background: rgba(16, 185, 129, 0.05); border-radius: 12px; border-left: 4px solid #10b981;">
    <h2 style="font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; color: #10b981;">💎 Ejemplo Práctico</h2>
    <div style="padding: 1rem; background: rgba(255, 255, 255, 0.8); border-radius: 8px;">
      Un caso de uso real, frase completa o snippet de código
    </div>
  </section>
</div>
```

**REGLAS CRÍTICAS PARA HTML:**
- SIEMPRE usa HTML válido y bien formado
- Cierra TODAS las etiquetas correctamente
- Usa estilos inline para TODOS los elementos (colores, espaciado, bordes)
- NO uses Markdown, SOLO HTML
- Usa tablas HTML (`<table>`) para comparaciones con estilos inline
- Usa listas HTML (`<ul>`, `<ol>`) para información estructurada
- Usa `<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 4px;">` y `<pre>` para código
- Separa secciones con `<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 2rem 0;">` o con secciones con bordes

---

### 🎨 INSTRUCCIONES PARA DIAGRAMAS (JSON ONLY) - REGLAS ESTRICTAS:

**🚫 PROHIBIDO GENERAR DIAGRAMAS PARA:**
- Vocabulario, palabras, frases o listas de términos
- Estructuras gramaticales o reglas de idioma
- Procesos, pasos o instrucciones
- Conceptos individuales o explicaciones de un solo tema
- Guías de uso, tutoriales o procedimientos
- Cualquier contenido que NO sea una comparación directa de 2 elementos

**✅ SOLO GENERA DIAGRAMAS SI:**
- Es una comparación DIRECTA de EXACTAMENTE 2 elementos (ej: "Python vs JavaScript", "A vs B")
- El título contiene "vs", "versus", "contra" o "comparación" seguido de 2 elementos
- Necesitas comparar características, ventajas/desventajas, o diferencias entre 2 cosas específicas

**FORMATO OBLIGATORIO PARA COMPARACIONES:**

```diagram-json
{
  "title": "Elemento A vs Elemento B",
  "nodes": [
    {"id": "A", "label": "Elemento A", "color": "#6366f1"},
    {"id": "B", "label": "Elemento B", "color": "#10b981"}
  ],
  "edges": []
}
```

**REGLAS CRÍTICAS:**
- DEBE tener EXACTAMENTE 2 nodos (ni más, ni menos)
- El título DEBE contener "vs", "versus", "contra" o "comparación"
- NO uses edges (conexiones) en comparaciones
- Si NO es una comparación de 2 elementos → NO generes diagrama
- Si tienes CUALQUIER duda → NO generes diagrama. Usa tablas o listas en su lugar.

### 🖼️ INSTRUCCIONES PARA IMÁGENES:

**✅ GENERA BLOQUES DE IMAGEN CUANDO:**
- Una imagen ayudaría significativamente a explicar un concepto visual (ej: diagramas anatómicos, estructuras químicas, mapas, gráficos)
- El concepto es difícil de entender sin una representación visual
- Estás explicando algo que se beneficia de una ilustración (ej: partes de una célula, estructura de un átomo, mapa geográfico)

**FORMATO OBLIGATORIO PARA IMÁGENES:**

```image
query: descripción de lo que debe mostrar la imagen
description: explicación de cómo la imagen ayuda a entender el concepto
```

**EJEMPLOS VÁLIDOS:**
```image
query: estructura de una célula eucariota con orgánulos etiquetados
description: Esta imagen muestra las partes principales de una célula eucariota, ayudando a visualizar la organización celular.
```

```image
query: tabla periódica de elementos químicos
description: La tabla periódica muestra la organización de los elementos químicos según su número atómico y propiedades.
```

**REGLAS:**
- Solo genera bloques de imagen cuando realmente añadan valor educativo
- La descripción debe explicar por qué la imagen es útil para entender el concepto
- Usa queries descriptivas y específicas (en español o inglés)
- NO generes imágenes para conceptos abstractos que no se beneficien de una visualización
- **IMPORTANTE**: Si el concepto se beneficiaría de una imagen, SIEMPRE incluye un bloque de imagen

### 🎬 INSTRUCCIONES PARA VIDEOS:

**✅ GENERA BLOQUES DE VIDEO CUANDO:**
- Un video explicativo ayudaría significativamente a entender un concepto (ej: procesos, tutoriales, demostraciones)
- El concepto es mejor explicado con movimiento o secuencia (ej: cómo funciona algo, pasos de un proceso)
- Estás explicando algo que se beneficia de una demostración visual (ej: cómo resolver un problema, cómo usar una herramienta)
- El usuario explícitamente pide un video o visualización

**FORMATO OBLIGATORIO PARA VIDEOS:**

```youtube-video
query: descripción de lo que debe explicar el video
description: explicación de cómo el video ayuda a entender el concepto
```

**EJEMPLOS VÁLIDOS:**
```youtube-video
query: cómo funciona el sistema circulatorio explicación educativa
description: Este video muestra cómo funciona el sistema circulatorio con animaciones que ayudan a visualizar el flujo de sangre.
```

```youtube-video
query: tutorial cómo resolver ecuaciones de segundo grado paso a paso
description: Este video explica paso a paso cómo resolver ecuaciones de segundo grado con ejemplos prácticos.
```

**REGLAS:**
- Solo genera bloques de video cuando realmente añadan valor educativo
- La descripción debe explicar por qué el video es útil para entender el concepto
- Usa queries descriptivas y específicas (en español o inglés)
- **IMPORTANTE**: Si el concepto se beneficiaría de un video, SIEMPRE incluye un bloque de video
- Prioriza videos educativos y tutoriales sobre entretenimiento

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
        
        # Detectar si el contenido es un temario (lista de temas) en lugar de contenido educativo
        def detect_and_extract_topics_from_syllabus(content: str) -> Optional[List[str]]:
            """Detecta si el contenido es un temario y extrae los temas listados"""
            if not content:
                return None
            
            content_lower = content.lower()
            
            # Palabras clave que indican que es un temario
            syllabus_keywords = [
                "temario", "temas del examen", "temas de la oposición", "temas a estudiar",
                "programa", "índice de temas", "lista de temas", "contenido del examen",
                "temas incluidos", "materias del examen"
            ]
            
            is_syllabus = any(keyword in content_lower for keyword in syllabus_keywords)
            
            if not is_syllabus:
                return None
            
            # Intentar extraer temas del temario
            # re ya está importado al principio del archivo
            topics = []
            
            # Patrones comunes para listas de temas:
            # 1. Tema 1: Título del tema
            # 2. 1. Título del tema
            # 3. - Título del tema
            # 4. • Título del tema
            
            patterns = [
                r'(?:tema|tema\s+\d+|^\d+\.)\s*[:\-]?\s*([^\n]+?)(?=\n(?:tema|tema\s+\d+|\d+\.|$))',
                r'^\d+\.\s*([^\n]+)',
                r'^[-•]\s*([^\n]+)',
                r'(?:tema|tema\s+\d+)\s+([^\n]+?)(?=\n(?:tema|tema\s+\d+|\d+\.|$))',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, content, re.MULTILINE | re.IGNORECASE)
                if matches:
                    topics.extend([m.strip() for m in matches if len(m.strip()) > 5])  # Filtrar temas muy cortos
            
            # Si encontramos temas, devolverlos
            if topics:
                # Limpiar y deduplicar
                cleaned_topics = []
                seen = set()
                for topic in topics:
                    topic_clean = topic.strip()
                    # Eliminar prefijos comunes
                    topic_clean = re.sub(r'^(tema\s*\d+[:\-]?\s*)', '', topic_clean, flags=re.IGNORECASE)
                    topic_clean = re.sub(r'^\d+[:\-]?\s*', '', topic_clean)
                    if topic_clean and len(topic_clean) > 5 and topic_clean.lower() not in seen:
                        cleaned_topics.append(topic_clean)
                        seen.add(topic_clean.lower())
                
                if cleaned_topics:
                    print(f"📋 Temario detectado con {len(cleaned_topics)} temas extraídos")
                    return cleaned_topics[:20]  # Limitar a 20 temas para no sobrecargar
        
            return None
        
        # Determinar si hay historial de conversación relevante al tema
        has_relevant_conversation = False
        if conversation_text and final_topics:
            # Verificar si el historial menciona el tema
            main_topic_lower = final_topics[0].lower() if isinstance(final_topics, list) else str(final_topics).lower()
            if main_topic_lower in conversation_text.lower():
                has_relevant_conversation = True
                print(f"📝 Historial de conversación contiene información sobre '{final_topics[0]}'")
        
        # Detectar si el contenido subido es un temario
        all_content = self.memory.get_all_documents(limit=50)
        syllabus_topics = None
        if all_content:
            combined_doc_content = "\n\n".join(all_content[:10])  # Revisar primeros documentos
            syllabus_topics = detect_and_extract_topics_from_syllabus(combined_doc_content)
            
            if syllabus_topics:
                print(f"📋 TEMARIO DETECTADO: Se encontraron {len(syllabus_topics)} temas en el documento")
                print(f"📋 Primeros temas: {', '.join(syllabus_topics[:5])}")
                # Si se detectó un temario y el usuario pide apuntes/tests, usar los temas del temario
                if not final_topics or (len(final_topics) == 1 and final_topics[0].lower() in ["temario", "temas", "contenido"]):
                    final_topics = syllabus_topics
                    print(f"✅ Usando temas del temario para generar contenido educativo")
        
        if final_topics:
            # Intentar usar caché de resúmenes si está disponible
            cached_summary = None
            course_id = None
            if course_context and isinstance(final_topics, list) and len(final_topics) == 1:
                # Solo usar caché si hay un solo tema y hay contexto de curso
                try:
                    from summary_cache import get_cached_summary_for_context
                    # Intentar obtener course_id del contexto
                    # Nota: course_id puede venir de diferentes lugares según el contexto
                    main_topic = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
                    conversation_length = len(conversation_history) if conversation_history else 0
                    
                    # Intentar obtener course_id si está disponible en el contexto
                    # (Esto dependerá de cómo se pase el course_id al agente)
                    cached_summary = get_cached_summary_for_context(
                        course_id=course_id or "default",
                        topic=main_topic,
                        conversation_length=conversation_length
                    )
                    
                    if cached_summary:
                        print(f"💾 Usando resumen en caché para tema '{main_topic}' (nivel según longitud: {conversation_length})")
                except Exception as e:
                    print(f"⚠️ Error obteniendo caché de resumen: {e}")
            
            # Si hay historial relevante, usarlo primero
            if has_relevant_conversation:
                combined_content = conversation_text
                print(f"📝 Usando historial de conversación sobre '{final_topics[0]}'")
            elif cached_summary:
                # Usar resumen en caché como base
                main_topic = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
                combined_content = f"TEMA: {main_topic}\n\nRESUMEN DEL CONTENIDO:\n{cached_summary}\n\nGenera apuntes completos basándote en este resumen, adaptado al nivel del estudiante."
                
                # Añadir historial si existe
                if conversation_text:
                    combined_content += f"\n\n---\n\nHISTORIAL DE CONVERSACIÓN (contexto adicional):\n{conversation_text}"
                print(f"📝 Usando resumen en caché para '{main_topic}'")
            else:
                # Si no hay historial relevante pero hay tema, generar desde cero
                # NO buscar en documentos genéricos que pueden no ser relevantes
                if conversation_text:
                    # Si hay historial pero no es relevante, aún así incluirlo pero priorizar el tema
                    print(f"📝 Historial de conversación no es relevante para '{final_topics[0]}', generando desde cero con el tema")
                else:
                    print(f"📝 No hay historial de conversación, generando apuntes educativos desde cero para '{final_topics[0]}'")
                
                # Si hay múltiples temas (temario), generar contenido sobre todos ellos
                if isinstance(final_topics, list) and len(final_topics) > 1:
                    topics_list = "\n".join([f"- {t}" for t in final_topics[:15]])  # Limitar a 15 temas
                    combined_content = f"TEMARIO - TEMAS A PREPARAR:\n\n{topics_list}\n\n🚨 INSTRUCCIÓN CRÍTICA: El usuario quiere preparar estos temas de una oposición/examen. NO generes contenido sobre 'el temario' o 'qué temas entran'. En su lugar, genera contenido educativo COMPLETO sobre CADA UNO de estos temas. Crea apuntes detallados que cubran el contenido real de cada tema, como si fueras a enseñar ese tema desde cero. Organiza el contenido por tema y cubre todos los temas listados."
                else:
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
            print(f"✅ Contenido válido: {len(content_words)} palabras")
        else:
            print(f"✅ Generando contenido educativo desde cero para el tema especificado")
        
        # Preparar nota de nivel si está disponible
        level_note = ""
        user_level_display = user_level if user_level is not None else 0
        
        # IMPORTANTE: Solo adaptar al nivel si hay conversation_history o chat_id (apuntes del chat)
        # Los resúmenes automáticos de temas NO deben adaptarse al nivel del usuario
        should_adapt_to_level = user_level is not None and (conversation_history or chat_id)
        
        if should_adapt_to_level:
            if user_level <= 3:
                level_note = f"""
**NIVEL PRINCIPIANTE ({user_level}/10) - INSTRUCCIONES OBLIGATORIAS:**
- Solo vocabulario esencial: saludos, números 1-10, colores básicos
- Frases de supervivencia muy simples: "Hola", "Adiós", "Gracias", "¿Cómo estás?"
- Pronunciación básica explicada con letras
- Sin gramática compleja, solo estructuras simples
- Ejemplos muy simples y comunes
- Lenguaje extremadamente simple y claro
- Explicaciones paso a paso muy detalladas"""
            elif user_level <= 6:
                level_note = f"""
**NIVEL INTERMEDIO ({user_level}/10) - INSTRUCCIONES OBLIGATORIAS:**
- Vocabulario temático: trabajo, viajes, hobbies, emociones
- Tiempos verbales: presente, pasado simple, futuro cercano
- Estructuras complejas básicas: condicionales simples, comparativos
- Frases útiles para situaciones comunes
- Ejemplos contextualizados
- Puedes usar terminología técnica pero siempre con explicaciones claras"""
            else:
                level_note = f"""
**NIVEL AVANZADO ({user_level}/10) - INSTRUCCIONES OBLIGATORIAS:**
- Vocabulario sofisticado: términos académicos, literarios, técnicos
- Tiempos verbales avanzados: pluscuamperfecto, subjuntivo complejo
- Expresiones idiomáticas raras y cultas
- Gramática compleja: perífrasis, construcciones estilísticas
- Diferencias regionales detalladas (dialectos, acentos)
- Matices y sutilezas del idioma
- Ejemplos de literatura o discursos formales
- Puedes usar terminología técnica avanzada y profundizar en los conceptos"""
        else:
            if not should_adapt_to_level:
                # Para resúmenes automáticos de temas, no usar nivel
                level_note = ""
                user_level_display = 0
            else:
                level_note = "\n\n**NIVEL NO ESPECIFICADO**: Usa nivel intermedio por defecto."
                user_level_display = 5
        
        # Preparar nombre del tema
        topic_name = ""
        if final_topics and len(final_topics) > 0:
            topic_name = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
        elif topic:
            topic_name = topic
        elif combined_content.strip().startswith("TEMA:"):
            # Extraer el tema del contenido generado
            # re ya está importado al principio del archivo
            topic_match = re.search(r'TEMA:\s*(.+)', combined_content)
            if topic_match:
                topic_name = topic_match.group(1).split('\n')[0].strip()
        
        if not topic_name:
            topic_name = "Estudio"
        
        # Detectar si el tema es un idioma para generar en ese idioma
        is_language_topic = False
        language_name = ""
        if topic_name:
            topic_lower = topic_name.lower()
            language_map = {
                "inglés": "inglés", "english": "inglés",
                "francés": "francés", "francais": "francés", "french": "francés",
                "alemán": "alemán", "deutsch": "alemán", "german": "alemán",
                "italiano": "italiano", "italian": "italiano",
                "portugués": "portugués", "portuguese": "portugués",
                "chino": "chino", "chinese": "chino", "mandarín": "chino",
                "japonés": "japonés", "japanese": "japonés", "japones": "japonés",
                "coreano": "coreano", "korean": "coreano",
                "ruso": "ruso", "russian": "ruso",
                "español": "español", "spanish": "español",
            }
            for key, value in language_map.items():
                if key in topic_lower:
                    is_language_topic = True
                    language_name = value
                    break
        
        # Preparar instrucción de idioma
        language_instruction = ""
        if is_language_topic and language_name:
            language_instruction = f"""
### 🌍 IDIOMA DE GENERACIÓN (CRÍTICO):

**IMPORTANTE**: El tema es "{topic_name}" ({language_name}). 

**ESTRUCTURA DE IDIOMAS:**
- Las **explicaciones, títulos y descripciones** deben estar en **ESPAÑOL** (el idioma con el que te hablo)
- El **contenido del idioma objetivo** ({language_name}) debe estar en **{language_name.upper()}**
- Las **traducciones** deben mostrar: palabra en {language_name} → traducción en español

Ejemplo CORRECTO para Inglés:
- Título: "# Inglés" (en español)
- Concepto: "**Hello**: Hola." (palabra en inglés, traducción en español)
- Ejemplo: "Hello, how are you?": ¿Cómo estás? (frase en inglés, traducción en español)

Ejemplo CORRECTO para Francés:
- Título: "# Francés" (en español)
- Concepto: "**Bonjour**: Buenos días." (palabra en francés, traducción en español)
- Ejemplo: "Bonjour, comment allez-vous?": Buenos días, ¿cómo está usted? (frase en francés, traducción en español)

**REGLA**: Explica en español, pero muestra el contenido del idioma objetivo en {language_name}.
"""
        
        # Usar replace directo en lugar de format para evitar problemas con llaves en el contenido
        # Esto es más seguro cuando el contenido puede contener llaves también
        # Reemplazar también {language_name} y {user_level} en el prompt
        # Asegurarse de que user_level_display esté definido
        if 'user_level_display' not in locals():
            user_level_display = user_level if user_level is not None else 0
        
        # Determinar si se debe adaptar al nivel
        if 'should_adapt_to_level' not in locals():
            should_adapt_to_level = user_level is not None and (conversation_history or chat_id)
        
        # Crear instrucción de nivel
        if should_adapt_to_level and user_level is not None:
            level_instruction = f"**NIVEL ACTUAL DEL ESTUDIANTE: {user_level}/10**\n\n**DEBES ADAPTAR ESTRICTAMENTE TODO EL CONTENIDO AL NIVEL {user_level}/10. NO uses contenido de otros niveles.**"
        else:
            level_instruction = "**GENERA CONTENIDO OBJETIVO Y COMPLETO DEL TEMA, SIN ADAPTARLO A UN NIVEL ESPECÍFICO.**"
        
        # Construir información del curso si está disponible
        course_context_str = ""
        if course_context:
            course_info = []
            course_info.append(f"**Curso:** {course_context.get('title', '')}")
            if course_context.get('description'):
                course_info.append(f"**Descripción:** {course_context.get('description', '')}")
            if course_context.get('topics'):
                topics_list = [t.get('name', '') if isinstance(t, dict) else str(t) for t in course_context.get('topics', [])]
                if topics_list:
                    course_info.append(f"**Temas del curso:** {', '.join(topics_list)}")
            if course_info:
                course_context_str = "\n\n**CONTEXTO DEL CURSO:**\n" + "\n".join(course_info) + "\n\n**IMPORTANTE:** Siempre ten presente esta información del curso al generar los apuntes. El estudiante está trabajando en este curso específico."
        
        # Construir información del examen si está disponible
        exam_context_str = ""
        if exam_info:
            days_left = exam_info.get('days_until_exam', 0)
            exam_date = exam_info.get('exam_date', '')
            if days_left > 0:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **Días restantes:** {days_left} días\n\n**IMPORTANTE:** El estudiante tiene un examen en {days_left} días. Adapta los apuntes para ayudarle a prepararse eficientemente. Enfócate en los conceptos clave que entran en el examen y ayúdale a priorizar su estudio."
            elif days_left == 0:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **El examen es HOY**\n\n**IMPORTANTE:** El examen es hoy. Enfócate en repasar conceptos clave y dar confianza al estudiante."
            else:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **El examen ya pasó**\n\n**IMPORTANTE:** El examen ya pasó. Puedes ayudar al estudiante a repasar o profundizar en los conceptos."
        
        final_prompt = prompt_template.replace("{content}", combined_content).replace("{level_note}", level_note).replace("{level_instruction}", level_instruction).replace("{topic_name}", topic_name).replace("{language_instruction}", language_instruction).replace("{user_level}", str(user_level_display))
        
        # Añadir contexto del examen y curso
        if exam_context_str:
            final_prompt = final_prompt.replace("CONTENIDO FUENTE:", f"{exam_context_str}\n\nCONTENIDO FUENTE:")
        if course_context_str:
            final_prompt = final_prompt.replace("CONTENIDO FUENTE:", f"{course_context_str}\n\nCONTENIDO FUENTE:")
        if is_language_topic and language_name:
            final_prompt = final_prompt.replace("{language_name}", language_name)
        else:
            final_prompt = final_prompt.replace("{language_name}", "el idioma objetivo")
        
        # Añadir instrucción final crítica sobre HTML
        final_prompt += "\n\n**🚨 INSTRUCCIÓN FINAL CRÍTICA - LEE ESTO CON ATENCIÓN:**\n"
        final_prompt += "DEBES generar el contenido COMPLETO en formato HTML con estilos inline. \n"
        final_prompt += "❌ PROHIBIDO usar Markdown (NO uses #, ##, **, `, etc.). \n"
        final_prompt += "✅ OBLIGATORIO usar HTML (<h1>, <h2>, <p>, <ul>, <li>, <strong>, <code>, etc.). \n"
        final_prompt += "✅ TODOS los elementos DEBEN tener estilos inline (style=\"...\"). \n"
        final_prompt += "✅ El HTML debe ser válido, bien formado, con todas las etiquetas cerradas correctamente. \n"
        final_prompt += "✅ Responde SOLO con el HTML, sin texto adicional antes o después. \n"
        final_prompt += "✅ NO uses Markdown bajo ninguna circunstancia. SOLO HTML.\n"
        
        prompt = final_prompt

        try:
            print("🔄 Invocando LLM para generar apuntes...")
            response = self.llm.invoke(prompt)
            notes_content = response.content
            print(f"✅ Respuesta recibida: {len(notes_content)} caracteres")
            print(f"📄 Primeros 300 caracteres: {notes_content[:300]}")
            
            # Eliminar marcadores de código HTML (```html y ```) pero preservar el contenido
            original_length = len(notes_content)
            
            # Si comienza con ```html, extraer solo el contenido HTML
            if notes_content.strip().startswith('```html') or notes_content.strip().startswith('``` html'):
                # Buscar el bloque completo ```html ... ```
                match = re.search(r'```\s*html\s*\n(.*?)\n```\s*$', notes_content, flags=re.DOTALL | re.IGNORECASE)
                if match:
                    notes_content = match.group(1)
                    print(f"🧹 Extraído contenido HTML del bloque ```html (antes: {original_length} chars, después: {len(notes_content)} chars)")
                else:
                    # Si no hay cierre ```, eliminar solo el marcador inicial
                    notes_content = re.sub(r'^```\s*html\s*\n', '', notes_content, flags=re.MULTILINE | re.IGNORECASE)
                    notes_content = notes_content.strip()
                    print(f"🧹 Eliminado marcador ```html inicial (antes: {original_length} chars, después: {len(notes_content)} chars)")
            else:
                # Eliminar cualquier ```html suelto
                notes_content = re.sub(r'^```\s*html\s*$', '', notes_content, flags=re.MULTILINE | re.IGNORECASE)
                notes_content = re.sub(r'^```\s*$', '', notes_content, flags=re.MULTILINE)
                notes_content = notes_content.strip()
            
            # DETECCIÓN INMEDIATA: Verificar si es Markdown ANTES de cualquier procesamiento
            is_markdown = notes_content.strip().startswith('#') or bool(re.search(r'^#+\s+', notes_content.strip()[:100], re.MULTILINE))
            is_html = notes_content.strip().startswith('<') or bool(re.search(r'<[hH][1-6][^>]*style', notes_content.strip()[:200]))
            print(f"🔍 DETECCIÓN INMEDIATA: ¿Es Markdown? {is_markdown}, ¿Es HTML? {is_html}")
            
            # Si es Markdown, convertir INMEDIATAMENTE
            if is_markdown and not is_html:
                print("=" * 80)
                print("🚨 CONVIRTIENDO MARKDOWN A HTML INMEDIATAMENTE")
                print("=" * 80)
                notes_content = self._markdown_to_html_fallback(notes_content)
                print(f"✅ Conversión completada: {len(notes_content)} caracteres")
                print(f"📄 Primeros 300 chars después de conversión: {notes_content[:300]}")
                print("=" * 80)
            
            # Capturar tokens de uso
            usage_info = {
                "inputTokens": 0,
                "outputTokens": 0,
                "model": None
            }
            
            # Determinar el modelo usado
            model_used = None
            if self.current_model_config:
                model_used = self.current_model_config.name
            elif model:
                model_used = model
            elif hasattr(self.llm, 'model_name'):
                model_used = self.llm.model_name
            elif hasattr(self.llm, 'model'):
                model_used = self.llm.model
            else:
                model_used = "gpt-3.5-turbo"  # Fallback
            
            usage_info["model"] = model_used
            
            # Intentar obtener tokens de la metadata de la respuesta
            if hasattr(response, 'response_metadata') and response.response_metadata:
                token_usage = response.response_metadata.get('token_usage', {})
                usage_info["inputTokens"] = token_usage.get('prompt_tokens', 0)
                usage_info["outputTokens"] = token_usage.get('completion_tokens', 0)
            else:
                # Estimar tokens si no están disponibles (1 token ≈ 4 caracteres)
                usage_info["inputTokens"] = len(prompt) // 4
                usage_info["outputTokens"] = len(notes_content) // 4
            
            # POST-PROCESAMIENTO: Eliminar cualquier bloque Mermaid y validar diagramas JSON
            # re ya está importado al principio del archivo
            import json as json_module
            
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
            
            # Validar y filtrar diagramas JSON: solo mantener comparaciones 1vs1 válidas
            diagram_json_pattern = r'```\s*diagram-json\s*\n(.*?)```'
            diagram_matches = list(re.finditer(diagram_json_pattern, notes_content, re.DOTALL))
            
            diagrams_to_remove = []
            valid_diagrams_count = 0
            
            for match in diagram_matches:
                diagram_block = match.group(0)
                diagram_content = match.group(1).strip()
                
                try:
                    # Intentar parsear el JSON
                    diagram_data = json_module.loads(diagram_content)
                    
                    # Validar que sea una comparación válida
                    title = (diagram_data.get("title", "") or "").lower()
                    nodes = diagram_data.get("nodes", [])
                    
                    # Verificar que el título contenga palabras de comparación
                    has_comparison_keyword = any(keyword in title for keyword in [" vs ", " versus", " contra ", " vs. ", "comparación"])
                    
                    # Verificar que tenga exactamente 2 nodos
                    has_exactly_2_nodes = len(nodes) == 2
                    
                    # Si NO es una comparación válida, marcarlo para eliminación
                    if not (has_comparison_keyword and has_exactly_2_nodes):
                        diagrams_to_remove.append(match)
                        print(f"🚫 Diagrama eliminado: '{diagram_data.get('title', 'Sin título')}' - No es comparación válida (nodos: {len(nodes)}, tiene 'vs': {has_comparison_keyword})")
                    else:
                        valid_diagrams_count += 1
                        print(f"✅ Diagrama válido: '{diagram_data.get('title', 'Sin título')}' - Comparación 1vs1")
                        
                except (json_module.JSONDecodeError, AttributeError, TypeError) as e:
                    # Si no se puede parsear, eliminar el diagrama
                    diagrams_to_remove.append(match)
                    print(f"🚫 Diagrama eliminado: Error al parsear JSON - {e}")
            
            # Eliminar diagramas inválidos (de atrás hacia adelante para no afectar índices)
            for match in reversed(diagrams_to_remove):
                notes_content = notes_content[:match.start()] + notes_content[match.end():]
            
            # Validar que hay bloques diagram-json válidos en la respuesta
            total_diagrams = notes_content.count('```diagram-json') + notes_content.count('``` diagram-json')
            if valid_diagrams_count == 0 and total_diagrams > 0:
                print("⚠️ Todos los diagramas fueron eliminados por no ser comparaciones válidas")
            elif valid_diagrams_count > 0:
                print(f"✅ Post-procesamiento: {valid_diagrams_count} diagrama(s) válido(s) de comparación 1vs1")
            else:
                print("ℹ️ No se encontraron diagramas en la respuesta")
            
            # POST-PROCESAMIENTO: Procesar bloques de imagen y video
            notes_content = self._process_image_blocks(notes_content)
            notes_content = self._process_video_blocks(notes_content)
            
            # Validar que la respuesta no esté vacía
            if not notes_content or not notes_content.strip():
                return "# Error\n\n⚠️ La respuesta del modelo está vacía. Por favor, intenta de nuevo.", {"inputTokens": 0, "outputTokens": 0, "model": model_used if 'model_used' in locals() else None}
            
            # Validar que la respuesta contenga contenido válido
            if len(notes_content.strip()) < 50:
                return f"# Error\n\n⚠️ La respuesta del modelo es demasiado corta. Respuesta recibida: {notes_content[:200]}", {"inputTokens": 0, "outputTokens": 0, "model": model_used}
            
            # VALIDACIÓN CRÍTICA: Detectar si se generó Markdown en lugar de HTML
            # Si el contenido comienza con # (Markdown) en lugar de < (HTML), es un error
            content_start = notes_content.strip()[:1000]  # Revisar más contenido
            full_content = notes_content.strip()
            
            # Detectar patrones de Markdown
            has_markdown_headers = bool(re.search(r'^#+\s+', content_start, re.MULTILINE))
            has_markdown_bold = bool(re.search(r'\*\*[^*]+\*\*', content_start))
            has_markdown_tables = bool(re.search(r'^\|.+\|', content_start, re.MULTILINE))
            has_markdown_lists = bool(re.search(r'^[-*+]\s+', content_start, re.MULTILINE))
            has_markdown_code = bool(re.search(r'`[^`]+`', content_start))
            
            # Detectar HTML (más permisivo - solo verificar que tenga tags HTML básicos)
            # Si tiene tags HTML con estilos inline, es HTML válido
            has_html_tags = bool(re.search(r'<[hH][1-6][^>]*style|<[pP][^>]*style|<[dD][iI][vV][^>]*style|<[sS][eE][cC][tT][iI][oO][nN][^>]*style|<[uU][lL][^>]*style|<[lL][iI][^>]*style|<[tT][aA][bB][lL][eE][^>]*style|<[tT][hH][^>]*style|<[tT][dD][^>]*style', full_content))
            
            # También verificar si tiene estructura HTML básica (tags de apertura y cierre)
            if not has_html_tags:
                has_html_tags = bool(re.search(r'<[hH][1-6][^>]*>|<[pP][^>]*>|<[dD][iI][vV][^>]*>|<[sS][eE][cC][tT][iI][oO][nN][^>]*>|<[uU][lL][^>]*>|<[lL][iI][^>]*>|<[tT][aA][bB][lL][eE][^>]*>', full_content))
            
            # Si el contenido comienza con # o tiene patrones de Markdown pero no HTML estructurado, convertir
            starts_with_hash = full_content.startswith('#')
            has_markdown_patterns = has_markdown_headers or has_markdown_bold or has_markdown_tables or has_markdown_lists
            
            print(f"🔍 Análisis de contenido generado:")
            print(f"   - Comienza con #: {starts_with_hash}")
            print(f"   - Headers Markdown: {has_markdown_headers}")
            print(f"   - Bold Markdown: {has_markdown_bold}")
            print(f"   - Tablas Markdown: {has_markdown_tables}")
            print(f"   - Listas Markdown: {has_markdown_lists}")
            print(f"   - Código Markdown: {has_markdown_code}")
            print(f"   - HTML estructurado: {has_html_tags}")
            print(f"   - Primeros 200 chars: {full_content[:200]}")
            
            # Si tiene Markdown, convertir SIEMPRE (sin excepciones)
            if starts_with_hash or has_markdown_patterns:
                print("=" * 80)
                print("⚠️ ADVERTENCIA: El modelo generó Markdown en lugar de HTML.")
                print(f"   Detección: starts_with_hash={starts_with_hash}, has_markdown_patterns={has_markdown_patterns}")
                print(f"   has_html_tags={has_html_tags}")
                print("   Convirtiendo automáticamente a HTML...")
                print("=" * 80)
                notes_content = self._markdown_to_html_fallback(notes_content)
                print(f"✅ Conversión de Markdown a HTML completada ({len(notes_content)} caracteres)")
                print(f"   Primeros 300 chars después de conversión: {notes_content[:300]}")
                print("=" * 80)
            elif has_html_tags:
                print("✅ El contenido ya está en formato HTML")
            else:
                print("⚠️ No se detectó ni Markdown ni HTML estructurado. Asumiendo texto plano.")
            
            return notes_content, usage_info
        
        except KeyError as e:
            error_str = str(e)
            print(f"❌ KeyError al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            model_used = self.current_model_config.name if self.current_model_config else (model or "gpt-3.5-turbo")
            return f"# Error\n\n⚠️ Error al procesar la respuesta: {error_str}. Por favor, intenta de nuevo o verifica que hay contenido disponible.", {"inputTokens": 0, "outputTokens": 0, "model": model_used}
        except Exception as e:
            error_str = str(e)
            print(f"❌ Error al generar apuntes: {error_str}")
            import traceback
            traceback.print_exc()
            model_used = self.current_model_config.name if self.current_model_config else (model or "gpt-3.5-turbo")
            # Si el error es por límite de tokens, sugerir usar menos contenido
            if "context_length" in error_str.lower() or "tokens" in error_str.lower():
                return f"# Error\n\nEl contenido es demasiado extenso. Por favor, intenta generar apuntes sobre temas específicos o divide el documento en partes más pequeñas.\n\nError: {error_str}", {"inputTokens": 0, "outputTokens": 0, "model": model_used}
            return f"# Error\n\nNo se pudieron generar los apuntes: {error_str}", {"inputTokens": 0, "outputTokens": 0, "model": model_used}
    
    def _markdown_to_html_fallback(self, markdown_content: str) -> str:
        """
        Convierte Markdown básico a HTML como fallback cuando el modelo no genera HTML
        """
        # re ya está importado al principio del archivo
        
        # Primero, procesar tablas de Markdown
        def process_markdown_table(table_text: str) -> str:
            """Convierte una tabla de Markdown a HTML"""
            lines = [l.strip() for l in table_text.strip().split('\n') if l.strip()]
            if len(lines) < 2:
                return table_text
            
            # Separar header y separador
            header_line = lines[0]
            if len(lines) > 1 and re.match(r'^[\|\s\-:]+$', lines[1]):
                data_lines = lines[2:]
            else:
                data_lines = lines[1:]
            
            # Parsear header
            header_cells = [cell.strip() for cell in header_line.split('|') if cell.strip()]
            
            # Generar HTML de la tabla
            html = '<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0; background: rgba(255, 255, 255, 0.8); border-radius: 8px; overflow: hidden;">'
            html += '<thead style="background: rgba(99, 102, 241, 0.1);">'
            html += '<tr>'
            for cell in header_cells:
                html += f'<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #6366f1; border-bottom: 2px solid #6366f1;">{cell}</th>'
            html += '</tr>'
            html += '</thead>'
            html += '<tbody>'
            
            # Parsear filas de datos
            for row_line in data_lines:
                if not row_line.strip() or re.match(r'^[\|\s\-:]+$', row_line):
                    continue
                cells = [cell.strip() for cell in row_line.split('|') if cell.strip()]
                if len(cells) == len(header_cells):
                    html += '<tr style="border-bottom: 1px solid #e5e7eb;">'
                    for cell in cells:
                        # Procesar negritas en las celdas
                        cell = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #6366f1; font-weight: 600;">\1</strong>', cell)
                        html += f'<td style="padding: 0.75rem 1rem; color: #1f2937;">{cell}</td>'
                    html += '</tr>'
            
            html += '</tbody>'
            html += '</table>'
            return html
        
        # Detectar y procesar tablas primero (mejorado)
        table_replacements = {}
        
        # Buscar bloques de tablas (líneas consecutivas con |)
        lines = markdown_content.split('\n')
        table_blocks = []
        current_block = []
        current_start = None
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Detectar línea de tabla
            if '|' in stripped and stripped.startswith('|') and stripped.endswith('|'):
                if current_start is None:
                    current_start = i
                current_block.append((i, line))
            else:
                # Si hay un bloque pendiente, guardarlo
                if current_block:
                    table_blocks.append((current_start, current_block))
                    current_block = []
                    current_start = None
        
        # Procesar último bloque si existe
        if current_block:
            table_blocks.append((current_start, current_block))
        
        # Procesar bloques de atrás hacia adelante para no afectar índices
        for start_idx, block_lines in reversed(table_blocks):
            table_text = '\n'.join([line for _, line in block_lines])
            placeholder = f"__TABLE_{len(table_replacements)}__"
            table_replacements[placeholder] = process_markdown_table(table_text)
            # Reemplazar las líneas de la tabla
            for j, (orig_idx, _) in enumerate(block_lines):
                if j == 0:
                    lines[orig_idx] = placeholder
                else:
                    lines[orig_idx] = ''
        
        # Reconstruir markdown_content sin líneas vacías de tablas
        markdown_content = '\n'.join([l for l in lines if l != ''])
        
        # Procesar línea por línea para manejar correctamente la estructura
        lines = markdown_content.split('\n')
        result_lines = []
        in_list = False
        current_list_items = []
        
        for line in lines:
            line_stripped = line.strip()
            
            # Si es un placeholder de tabla, reemplazarlo
            if line_stripped.startswith('__TABLE_') and line_stripped in table_replacements:
                if in_list and current_list_items:
                    result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
                    result_lines.extend(current_list_items)
                    result_lines.append('</ul>')
                    current_list_items = []
                    in_list = False
                result_lines.append(table_replacements[line_stripped])
                continue
            
            # Línea vacía
            if not line_stripped:
                if in_list and current_list_items:
                    result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
                    result_lines.extend(current_list_items)
                    result_lines.append('</ul>')
                    current_list_items = []
                    in_list = False
                result_lines.append('')
                continue
            
            # Detectar headers (debe ir antes de otros procesamientos)
            # Manejar headers múltiples en la misma línea (ej: "# Physical Design ## ⚡ Conceptos")
            if line_stripped.startswith('#'):
                # Buscar todos los headers en la línea
                header_parts = re.findall(r'(#{1,4})\s+([^#]+?)(?=\s*#{1,4}|$)', line_stripped)
                if header_parts:
                    # Cerrar lista si está abierta
                    if in_list and current_list_items:
                        result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
                        result_lines.extend(current_list_items)
                        result_lines.append('</ul>')
                        current_list_items = []
                        in_list = False
                    
                    # Procesar cada header encontrado
                    for level_markers, content in header_parts:
                        level = len(level_markers)
                        content = content.strip()
                        # Procesar negritas y código dentro del header
                        content = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #6366f1; font-weight: 600;">\1</strong>', content)
                        content = re.sub(r'`(.+?)`', r'<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em;">\1</code>', content)
                        # Convertir emojis a iconos
                        content = self._convert_emojis_to_icons(content)
                        
                        if level == 1:
                            result_lines.append(f'<h1 style="font-size: 2.5rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid #6366f1; color: #1f2937;">{content}</h1>')
                        elif level == 2:
                            result_lines.append(f'<h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e5e7eb; color: #1f2937;">{content}</h2>')
                        elif level == 3:
                            result_lines.append(f'<h3 style="font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937;">{content}</h3>')
                        elif level == 4:
                            result_lines.append(f'<h4 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #1f2937;">{content}</h4>')
                    continue
            
            # Detectar header simple (fallback)
            header_match = re.match(r'^(#{1,4})\s+(.+)$', line_stripped)
            if header_match:
                # Cerrar lista si está abierta
                if in_list and current_list_items:
                    result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
                    result_lines.extend(current_list_items)
                    result_lines.append('</ul>')
                    current_list_items = []
                    in_list = False
                
                level = len(header_match.group(1))
                content = header_match.group(2).strip()
                
                # Procesar negritas y código dentro del header
                content = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #6366f1; font-weight: 600;">\1</strong>', content)
                content = re.sub(r'`(.+?)`', r'<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em;">\1</code>', content)
                # Convertir emojis a iconos
                content = self._convert_emojis_to_icons(content)
                
                if level == 1:
                    result_lines.append(f'<h1 style="font-size: 2.5rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid #6366f1; color: #1f2937;">{content}</h1>')
                elif level == 2:
                    result_lines.append(f'<h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e5e7eb; color: #1f2937;">{content}</h2>')
                elif level == 3:
                    result_lines.append(f'<h3 style="font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937;">{content}</h3>')
                elif level == 4:
                    result_lines.append(f'<h4 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #1f2937;">{content}</h4>')
                continue
            
            # Detectar listas
            list_match = re.match(r'^-\s+(.+)$', line_stripped)
            if list_match:
                content = list_match.group(1).strip()
                # Procesar negritas dentro de la lista
                content = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #6366f1; font-weight: 600;">\1</strong>', content)
                # Procesar código inline
                content = re.sub(r'`(.+?)`', r'<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em;">\1</code>', content)
                # Convertir emojis a iconos y quitar el fondo/highlight
                content = self._convert_emojis_to_icons(content)
                current_list_items.append(f'<li style="margin-bottom: 0.75rem; padding: 0.5rem 0; color: #1f2937;">{content}</li>')
                in_list = True
                continue
            
            # Párrafo normal
            if in_list and current_list_items:
                result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
                result_lines.extend(current_list_items)
                result_lines.append('</ul>')
                current_list_items = []
                in_list = False
            
            # Procesar negritas y código en párrafos
            content = line_stripped
            content = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #6366f1; font-weight: 600;">\1</strong>', content)
            content = re.sub(r'`(.+?)`', r'<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em;">\1</code>', content)
            # Convertir emojis a iconos
            content = self._convert_emojis_to_icons(content)
            result_lines.append(f'<p style="margin-bottom: 1rem; font-size: 1.15rem; line-height: 1.8; color: #1f2937;">{content}</p>')
        
        # Cerrar lista si queda abierta
        if in_list and current_list_items:
            result_lines.append('<ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">')
            result_lines.extend(current_list_items)
            result_lines.append('</ul>')
        
        html = '\n'.join(result_lines)
        
        # Reemplazar cualquier placeholder de tabla que quede
        for placeholder, table_html in table_replacements.items():
            html = html.replace(placeholder, table_html)
        
        # Envolver todo en un div
        html = f'<div style="max-width: 100%;">{html}</div>'
        
        return html
    
    def _convert_emojis_to_icons(self, text: str) -> str:
        """
        Convierte emojis comunes a iconos estilizados
        Los emojis se mantienen pero con mejor espaciado y tamaño
        """
        # Asegurar que los emojis tengan el tamaño correcto y se rendericen como iconos
        emoji_list = ['⚡', '📚', '⚠️', '💎', '🔍', '💡', '🎯', '📝', '✅', '❌']
        
        for emoji in emoji_list:
            if emoji in text:
                # Reemplazar emoji con versión estilizada
                text = text.replace(emoji, f'<span style="font-size: 1.2em; display: inline-block; margin-right: 0.3em; vertical-align: middle;">{emoji}</span>')
        
        return text
    
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
        
        # Nota: explain_concept no tiene chat_id, pero debería tenerlo para mantener chats separados
        # Por ahora, sin chat_id no recuperará contenido (evita mezclar chats)
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=5, chat_id=None, user_id=None)
        
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
