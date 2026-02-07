"""
Q&A Assistant Agent - Responde preguntas del estudiante
Usa RAG para buscar información relevante y responde con contexto
"""

from typing import List, Optional, Dict
from langchain_openai import ChatOpenAI
from memory.memory_manager import MemoryManager
import os
import re
import sys
import requests

# Importar model_manager
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from model_manager import ModelManager
except ImportError:
    ModelManager = None
    print("⚠️ Warning: model_manager no disponible, usando OpenAI directamente")

class QAAssistantAgent:
    """
    Agente especializado en responder preguntas del estudiante
    """
    
    def __init__(self, memory: MemoryManager, api_key: Optional[str] = None, mode: str = "auto"):
        """
        Inicializa el agente de Q&A
        
        Args:
            memory: Gestor de memoria del sistema
            api_key: API key de OpenAI (opcional, si no se proporciona usa la del entorno)
            mode: Modo de selección de modelo ("auto" = optimizar costes, "manual" = usar modelo especificado)
        """
        self.memory = memory
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.mode = mode
        self.llm = None  # Se inicializará cuando se necesite
        self.model_manager = None
        self.current_model_config = None
        self.unsplash_api_key = os.getenv("UNSPLASH_API_KEY")  # Opcional: API key de Unsplash
        
        # Inicializar model_manager si está disponible
        if ModelManager:
            try:
                self.model_manager = ModelManager(api_key=self.api_key, mode=mode)
                print("🤖 Q&A Assistant Agent inicializado con ModelManager (modo automático)")
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
                        api_key=self.api_key
                    )
                    print("🤖 Q&A Assistant Agent inicializado (sin ModelManager, usando gpt-3.5-turbo)")
                except Exception as e:
                    print(f"⚠️ Warning: No se pudo inicializar el LLM: {e}")
            else:
                print("⚠️ Q&A Assistant Agent inicializado sin API key (se requerirá para usar)")
    
    def _should_process_images(self, question: str) -> bool:
        """Detecta si el usuario está pidiendo explícitamente una imagen"""
        question_lower = question.lower()
        image_keywords = [
            "imagen", "imágenes", "muéstrame", "muéstrame una imagen", "dame una imagen",
            "imagen de", "foto", "fotografía", "visual", "visualización", "diagrama visual",
            "ilustración", "gráfico", "esquema visual", "dibujo"
        ]
        return any(keyword in question_lower for keyword in image_keywords)
    
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
                return f'\n\n<youtube-video id="{video_id}" url="{video_url}" title="{video_title}" />\n\n'
            else:
                print(f"⚠️ No se encontró video para '{query}', dejando descripción")
                return f'\n\n*🎬 Video sugerido: {description or query}*\n\n'
        
        # Reemplazar todos los bloques de video
        processed_content = re.sub(video_block_pattern, replace_video_block, content, flags=re.DOTALL | re.IGNORECASE)
        
        return processed_content
    
    def answer_question(self, question: str, user_id: str = "default", model: Optional[str] = None, chat_id: Optional[str] = None, topic: Optional[str] = None, force_premium: bool = False, initial_form_data: Optional[dict] = None, course_context: Optional[dict] = None, exam_info: Optional[dict] = None) -> tuple[str, dict]:
        """
        Responde una pregunta del estudiante usando el temario y el historial
        
        Args:
            question: Pregunta del estudiante
            user_id: ID del usuario (para historial)
            model: Modelo preferido (opcional, si no se especifica usa modo automático)
            chat_id: ID de la conversación (opcional, para obtener el nivel)
            topic: Tema del chat (opcional, para contextualizar las respuestas)
            force_premium: Si es True, fuerza el uso de un modelo premium (GPT-5)
            course_context: Contexto del curso (título, descripción, temas, subtopics)
            exam_info: Información del examen (fecha, días restantes)
            
        Returns:
            Respuesta contextualizada
        """
        # Usar model_manager si está disponible (modo automático)
        if self.model_manager:
            try:
                # Seleccionar modelo automáticamente (prioriza gratis > barato > caro)
                # Si force_premium es True, usar modelo premium
                self.current_model_config, self.llm = self.model_manager.select_model(
                    task_type="qa",
                    min_quality="premium" if force_premium else "medium",
                    preferred_model=model if model else None,
                    force_premium=force_premium
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
                            api_key=self.api_key
                        )
                        print("✅ Fallback a gpt-3.5-turbo")
                    except Exception as e2:
                        return f"⚠️ Error al inicializar el modelo: {str(e2)}", {"inputTokens": 0, "outputTokens": 0, "model": None}
                else:
                    return "⚠️ Se requiere configurar una API key de OpenAI o tener Ollama instalado. Por favor, configura tu API key en el modal de configuración o instala Ollama.", {"inputTokens": 0, "outputTokens": 0, "model": None}
        else:
            # Fallback: usar OpenAI directamente
            if not self.api_key:
                return "⚠️ Se requiere configurar una API key de OpenAI para responder preguntas. Por favor, configura tu API key en el modal de configuración.", {"inputTokens": 0, "outputTokens": 0, "model": None}
            
            # Usar modelo especificado o el más barato disponible
            model_to_use = model if model else "gpt-3.5-turbo"  # Por defecto usar el más barato
            
            try:
                self.llm = ChatOpenAI(
                    model=model_to_use,
                    temperature=0.7,
                    api_key=self.api_key
                )
            except Exception as e:
                # Fallback a gpt-3.5-turbo si el modelo especificado falla
                try:
                    print(f"⚠️ Modelo {model_to_use} no disponible, usando gpt-3.5-turbo como fallback")
                    self.llm = ChatOpenAI(
                        model="gpt-3.5-turbo",
                        temperature=0.7,
                        api_key=self.api_key
                    )
                except Exception as e2:
                    return f"⚠️ Error al inicializar el modelo: {str(e2)}", {"inputTokens": 0, "outputTokens": 0, "model": None}
        
        # Recuperar contenido relevante de la memoria (solo del chat actual)
        relevant_content = self.memory.retrieve_relevant_content(question, n_results=5, chat_id=chat_id, user_id=user_id)
        
        # Obtener historial de conversación (solo del chat actual)
        conversation_history = self.memory.get_conversation_history(user_id, chat_id)
        
        # Resumir historial si es largo
        if conversation_history and len(conversation_history) > 15:
            try:
                from conversation_summarizer import summarize_conversation_history, format_summarized_history
                
                summary_data = summarize_conversation_history(
                    history=conversation_history,
                    api_key=self.api_key if hasattr(self, 'api_key') else None,
                    model=None,
                    max_messages=10,
                    use_llm=bool(self.api_key)
                )
                
                # Reemplazar historial completo con resumen + recientes
                conversation_history = summary_data.get("recent_messages", [])
                history_summary = format_summarized_history(summary_data)
                
                # Añadir resumen al contexto si existe
                if history_summary:
                    if relevant_content:
                        relevant_content = [history_summary] + relevant_content
                    else:
                        relevant_content = [history_summary]
                
                print(f"📝 Historial resumido en QA: {len(conversation_history)} mensajes originales → resumen + {len(summary_data.get('recent_messages', []))} recientes")
            except Exception as e:
                print(f"⚠️ Error resumiendo historial en QA: {e}")
                # Continuar con historial normal
        
        # Si no hay contexto y no hay historial, usar el título del chat como contexto
        if not relevant_content and not conversation_history and chat_id:
            try:
                from chat_storage import load_chat
                chat_data = load_chat(user_id, chat_id)
                if chat_data and chat_data.get("title"):
                    # Usar el título como contexto único
                    relevant_content = [f"Tema del chat: {chat_data.get('title')}"]
                    print(f"📋 Usando título del chat como contexto: {chat_data.get('title')}")
            except Exception as e:
                print(f"⚠️ No se pudo obtener el título del chat: {e}")
        
        # Construir contexto, limpiando cualquier JSON problemático
        context_parts = []
        if relevant_content:
            for content_part in relevant_content:
                # Limpiar bloques diagram-json del contexto para evitar problemas
                content_cleaned = re.sub(r'```\s*diagram-json\s*\n.*?```', '[Esquema visual]', content_part, flags=re.DOTALL | re.IGNORECASE)
                context_parts.append(content_cleaned)
        context = "\n\n".join(context_parts) if context_parts else "No hay contenido relevante disponible en los documentos procesados."
        
        # Construir historial como string, limpiando cualquier JSON problemático
        history_str = ""
        if conversation_history:
            history_messages = []
            for msg in conversation_history[-5:]:  # Últimas 5 interacciones
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                # Limpiar bloques diagram-json del historial para evitar problemas con llaves
                # Reemplazar bloques JSON con un marcador simple
                content_cleaned = re.sub(r'```\s*diagram-json\s*\n.*?```', '[Esquema visual generado anteriormente]', content, flags=re.DOTALL | re.IGNORECASE)
                if role == 'user':
                    history_messages.append(f"Estudiante: {content_cleaned}")
                elif role == 'assistant':
                    history_messages.append(f"Asistente: {content_cleaned}")
            history_str = "\n".join(history_messages)
        
        # Crear prompt manualmente usando replace para evitar problemas con llaves en el contenido
        topic_context = ""
        if topic:
            if topic.lower() == "general":
                # Si el tema es "General", el agente debe explicar cómo usar la aplicación
                topic_context = """
                
**TEMA DE LA CONVERSACIÓN: "General" - Explicación de cómo usar Study Agents**

Este chat es especial: está diseñado para que el usuario aprenda cómo usar la aplicación Study Agents. Tu rol aquí es:

1. **Explicar la estructura de la aplicación:**
   - Cada chat representa UN tema de estudio específico
   - El usuario puede crear múltiples chats, cada uno para un tema diferente (ej: "SQL", "Inglés", "Matemáticas")
   - Cada chat mantiene su propio historial, documentos y progreso independiente

2. **Explicar las capacidades de Study Agents:**
   - Subir documentos PDF que se procesan automáticamente
   - Hacer preguntas sobre el material subido
   - Generar apuntes estructurados a partir de documentos
   - Crear tests personalizados adaptados al nivel del usuario
   - Generar ejercicios prácticos con corrección automática
   - Usar flashcards para aprender vocabulario (si el tema es un idioma)
   - Ejecutar código directamente en el navegador (si el tema es programación)

3. **Guiar al usuario sobre cómo empezar:**
   - Explicar que debe crear un nuevo chat para cada tema que quiera estudiar
   - Recomendar subir documentos primero para tener contexto
   - Explicar cómo usar cada herramienta disponible

4. **Responder preguntas sobre el funcionamiento de la aplicación:**
   - Cómo funciona cada herramienta
   - Cuándo usar cada herramienta
   - Cómo personalizar la experiencia de aprendizaje

**IMPORTANTE:** Cuando el tema es "General", NO debes responder preguntas sobre temas académicos específicos. En su lugar, explica cómo usar Study Agents para estudiar ese tema. Por ejemplo, si preguntan sobre SQL, explica cómo pueden crear un chat de SQL, subir documentos sobre SQL, y usar las herramientas para aprender SQL.
"""
            else:
                topic_context = f"\n\nTEMA DE LA CONVERSACIÓN: Estamos trabajando específicamente sobre **{topic}**. Enfócate en este tema y proporciona información relevante sobre {topic}. Si la pregunta del estudiante está relacionada con este tema, asegúrate de contextualizarla dentro de {topic}."
        
        # Añadir contexto del formulario inicial si está disponible
        form_context = ""
        if initial_form_data:
            form_parts = []
            if initial_form_data.get("level") is not None:
                form_parts.append(f"- **Nivel del estudiante**: {initial_form_data['level']}/10")
            if initial_form_data.get("learningGoal"):
                form_parts.append(f"- **Objetivo de aprendizaje**: {initial_form_data['learningGoal']}")
            if initial_form_data.get("timeAvailable"):
                form_parts.append(f"- **Tiempo disponible**: {initial_form_data['timeAvailable']}")
            
            if form_parts:
                form_context = f"\n\n📋 INFORMACIÓN DEL ESTUDIANTE (importante para personalizar la respuesta):\n" + "\n".join(form_parts) + "\n\n**IMPORTANTE**: Adapta tu respuesta según esta información. Por ejemplo:\n- Si el tiempo es limitado (ej: 1 semana), enfócate en lo esencial y práctico\n- Si el objetivo es específico (ej: vivir en Japón), prioriza contenido relevante para ese contexto\n- Si el nivel es bajo, usa explicaciones más simples y ejemplos básicos\n- Si el nivel es alto, puedes profundizar más y usar terminología técnica"
        
        # Construir contexto del curso si está disponible
        course_context_str = ""
        if course_context:
            course_info = []
            course_info.append(f"**Curso:** {course_context.get('title', '')}")
            if course_context.get('description'):
                course_info.append(f"**Descripción:** {course_context.get('description', '')}")
            
            topics_list = course_context.get('topics', [])
            if topics_list:
                course_info.append(f"**Temas del curso:** {', '.join(topics_list)}")
            
            subtopics = course_context.get('subtopics', {})
            if subtopics and topic and topic in subtopics:
                subtopics_list = subtopics[topic]
                if subtopics_list:
                    course_info.append(f"**Subapartados de '{topic}':** {', '.join(subtopics_list)}")
            
            if course_info:
                course_context_str = "\n\n**CONTEXTO DEL CURSO:**\n" + "\n".join(course_info) + "\n\n**IMPORTANTE:** Siempre ten presente esta información del curso al responder. El estudiante está trabajando en este curso específico."
        
        # Construir información del examen si está disponible
        exam_context_str = ""
        if exam_info:
            days_left = exam_info.get('days_until_exam', 0)
            exam_date = exam_info.get('exam_date', '')
            if days_left > 0:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **Días restantes:** {days_left} días\n\n**IMPORTANTE:** El estudiante tiene un examen en {days_left} días. Adapta tus respuestas para ayudarle a prepararse eficientemente. Enfócate en los conceptos clave que entran en el examen y ayúdale a priorizar su estudio."
            elif days_left == 0:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **El examen es HOY**\n\n**IMPORTANTE:** El examen es hoy. Enfócate en repasar conceptos clave y dar confianza al estudiante."
            else:
                exam_context_str = f"\n\n**INFORMACIÓN DEL EXAMEN:**\n- **Fecha del examen:** {exam_date}\n- **El examen ya pasó**\n\n**IMPORTANTE:** El examen ya pasó. Puedes ayudar al estudiante a repasar o profundizar en los conceptos."
        
        prompt_template = """Eres un asistente educativo experto que ayuda a estudiantes a entender conceptos.

Tu objetivo es responder preguntas de manera clara, natural y educativa, como cualquier LLM moderno, pero usando HTML para mejorar el diseño visual de tus respuestas.

**FORMATO DE RESPUESTA:**
- Usa HTML con estilos inline para mejorar la presentación visual
- Usa `<h2>`, `<h3>` para títulos
- Usa `<p>` para párrafos
- Usa `<ul>`, `<ol>`, `<li>` para listas
- Usa `<strong>` y `<em>` para énfasis
- Usa `<code>` y `<pre>` para código
- Usa `<table>` para tablas cuando compares conceptos
- Usa colores y estilos inline para hacer el contenido más visual y atractivo
- Mantén un tono natural y conversacional, como si fueras un tutor personal

**CONTEXTO IMPORTANTE:**
- Si hay contenido del temario/PDF disponible, úsalo como referencia principal
- Si no hay información en el temario, puedes usar tu conocimiento general
- Mantén un tono amigable, paciente y natural
- Explica conceptos de manera clara y adaptada al nivel del estudiante

__COURSE_CONTEXT_PLACEHOLDER__

__EXAM_CONTEXT_PLACEHOLDER__

__TOPIC_CONTEXT_PLACEHOLDER__

__FORM_CONTEXT_PLACEHOLDER__

**CONTENIDO DEL TEMARIO/PDF:**
__CONTEXT_PLACEHOLDER__

**HISTORIAL DE CONVERSACIÓN:**
__HISTORY_PLACEHOLDER__

**PREGUNTA DEL ESTUDIANTE:** __QUESTION_PLACEHOLDER__

Responde de manera natural, clara y completa usando HTML con estilos inline para mejorar la presentación visual. Si el contexto del temario es relevante, úsalo como referencia principal."""

        # Reemplazar placeholders de forma segura (sin usar f-strings que interpretan llaves)
        full_prompt = prompt_template.replace("__COURSE_CONTEXT_PLACEHOLDER__", course_context_str)
        full_prompt = full_prompt.replace("__EXAM_CONTEXT_PLACEHOLDER__", exam_context_str)
        full_prompt = full_prompt.replace("__TOPIC_CONTEXT_PLACEHOLDER__", topic_context)
        full_prompt = full_prompt.replace("__FORM_CONTEXT_PLACEHOLDER__", form_context)
        full_prompt = full_prompt.replace("__CONTEXT_PLACEHOLDER__", context)
        full_prompt = full_prompt.replace("__HISTORY_PLACEHOLDER__", history_str or "No hay historial previo de conversación.")
        full_prompt = full_prompt.replace("__QUESTION_PLACEHOLDER__", question)

        try:
            # Usar invoke directamente en lugar de ChatPromptTemplate para evitar problemas con llaves
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content="Eres un asistente educativo experto que ayuda a estudiantes a entender conceptos."),
                HumanMessage(content=full_prompt)
            ]
            response = self.llm.invoke(messages)
            
            answer = response.content
            
            # POST-PROCESAMIENTO: Procesar bloques de imagen y video (siempre, para detectar bloques generados por el modelo)
            answer = self._process_image_blocks(answer)
            answer = self._process_video_blocks(answer)
            
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
            
            # POST-PROCESAMIENTO: Eliminar cualquier bloque Mermaid que el modelo pueda haber generado
            # Detectar y eliminar bloques de código Mermaid (multilínea)
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
                answer = re.sub(pattern, '', answer, flags=re.DOTALL | re.IGNORECASE | re.MULTILINE)
            
            # POST-PROCESAMIENTO: Validar y eliminar diagramas JSON que NO sean comparaciones de 2 elementos
            import json as json_module
            diagram_json_pattern = r'```\s*diagram-json\s*\n(.*?)```'
            diagram_matches = list(re.finditer(diagram_json_pattern, answer, re.DOTALL))
            diagrams_to_remove = []
            
            for match in diagram_matches:
                diagram_content = match.group(1).strip()
                try:
                    diagram_data = json_module.loads(diagram_content)
                    title = (diagram_data.get("title", "") or "").lower()
                    nodes = diagram_data.get("nodes", [])
                    
                    # Verificar que el título contenga palabras de comparación
                    has_comparison_keyword = any(keyword in title for keyword in [" vs ", " versus", " contra ", " vs. ", "comparación"])
                    
                    # Verificar que tenga exactamente 2 nodos
                    has_exactly_2_nodes = len(nodes) == 2
                    
                    # Si NO es una comparación válida, marcarlo para eliminación
                    if not (has_comparison_keyword and has_exactly_2_nodes):
                        diagrams_to_remove.append(match)
                        print(f"🚫 Diagrama eliminado de respuesta QA: '{diagram_data.get('title', 'Sin título')}' - No es comparación válida (nodos: {len(nodes)}, tiene 'vs': {has_comparison_keyword})")
                except (json_module.JSONDecodeError, AttributeError, TypeError) as e:
                    # Si no se puede parsear, eliminar el diagrama
                    diagrams_to_remove.append(match)
                    print(f"🚫 Diagrama eliminado de respuesta QA: Error al parsear JSON - {e}")
            
            # Eliminar diagramas inválidos (de atrás hacia adelante para no afectar índices)
            for match in reversed(diagrams_to_remove):
                answer = answer[:match.start()] + answer[match.end():]
            
            # Limpiar líneas vacías múltiples
            answer = re.sub(r'\n{3,}', '\n\n', answer)
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", question, chat_id)
            self.memory.add_to_conversation_history(user_id, "assistant", answer, chat_id)
            
            return answer, usage_info
            
        except Exception as e:
            error_msg = f"Error al generar respuesta: {str(e)}"
            print(f"❌ {error_msg}")
            return f"Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo. Error: {str(e)}", {"inputTokens": 0, "outputTokens": 0, "model": None}
    
    def clarify_concept(self, concept: str, user_id: str = "default") -> str:
        """
        Aclara un concepto específico
        
        Args:
            concept: Concepto a aclarar
            user_id: ID del usuario
            
        Returns:
            Aclaración del concepto
        """
        # Nota: clarify_concept no tiene chat_id, pero debería tenerlo para mantener chats separados
        # Por ahora, sin chat_id no recuperará contenido (evita mezclar chats)
        relevant_content = self.memory.retrieve_relevant_content(concept, n_results=3, chat_id=None, user_id=user_id)
        
        if not relevant_content:
            return f"No se encontró información sobre '{concept}' en los documentos procesados. ¿Podrías subir documentos que contengan este concepto?"
        
        prompt = f"""Aclara el concepto '{concept}' de manera detallada y educativa:

CONTENIDO DEL TEMARIO:
{chr(10).join(relevant_content)}

Proporciona:
- Definición clara
- Ejemplos prácticos
- Analogías para facilitar la comprensión
- Relación con otros conceptos si es relevante"""

        try:
            response = self.llm.invoke(prompt)
            clarification = response.content
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", f"Aclara el concepto: {concept}", None)
            self.memory.add_to_conversation_history(user_id, "assistant", clarification, None)
            
            return clarification
        except Exception as e:
            return f"Error al aclarar el concepto: {str(e)}"

            response = self.llm.invoke(prompt)
            clarification = response.content
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", f"Aclara el concepto: {concept}", None)
            self.memory.add_to_conversation_history(user_id, "assistant", clarification, None)
            
            return clarification
        except Exception as e:
            return f"Error al aclarar el concepto: {str(e)}"

            response = self.llm.invoke(prompt)
            clarification = response.content
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", f"Aclara el concepto: {concept}", None)
            self.memory.add_to_conversation_history(user_id, "assistant", clarification, None)
            
            return clarification
        except Exception as e:
            return f"Error al aclarar el concepto: {str(e)}"

            response = self.llm.invoke(prompt)
            clarification = response.content
            
            # Guardar en historial
            self.memory.add_to_conversation_history(user_id, "user", f"Aclara el concepto: {concept}", None)
            self.memory.add_to_conversation_history(user_id, "assistant", clarification, None)
            
            return clarification
        except Exception as e:
            return f"Error al aclarar el concepto: {str(e)}"
