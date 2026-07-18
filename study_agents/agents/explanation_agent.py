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

try:
    from media_fallbacks import (
        search_wikimedia_commons_image,
        search_youtube_via_scrape,
        shorten_search_query,
    )
except ImportError:
    search_wikimedia_commons_image = None  # type: ignore
    search_youtube_via_scrape = None  # type: ignore
    shorten_search_query = None  # type: ignore

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
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY") or os.getenv("GOOGLE_API_KEY")
        
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
            query = shorten_search_query(query, 100) if shorten_search_query else query.strip()[:100]
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
            
            if search_wikimedia_commons_image:
                wiki = search_wikimedia_commons_image(query)
                if wiki:
                    print(f"✅ Imagen (Wikimedia Commons) para '{query[:60]}...'")
                    return wiki
                keywords = [w for w in re.findall(r"[A-Za-zÀ-ÿ0-9]+", query) if len(w) >= 4]
                simplified = " ".join(keywords[:4]).strip()
                if simplified and simplified.lower() != query.lower():
                    wiki = search_wikimedia_commons_image(simplified)
                    if wiki:
                        print(f"✅ Imagen (Wikimedia Commons, fallback) para '{simplified}'")
                        return wiki
            
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
            q = shorten_search_query(query, 120) if shorten_search_query else query.strip()[:120]

            if getattr(self, "youtube_api_key", None):
                try:
                    search_url = "https://www.googleapis.com/youtube/v3/search"
                    params = {
                        "part": "snippet",
                        "q": q,
                        "type": "video",
                        "maxResults": 5,
                        "key": self.youtube_api_key,
                        "order": "relevance",
                    }
                    response = requests.get(search_url, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    items = data.get("items") or []

                    if items:
                        best_video = None
                        best_score = 0
                        query_lower = q.lower()
                        educational_keywords = [
                            "explicación", "tutorial", "educativo", "aprender", "curso", "lección", "explicar", "cómo",
                        ]
                        has_educational = any(kw in query_lower for kw in educational_keywords)

                        for item in items:
                            snippet = item.get("snippet", {})
                            title = snippet.get("title", "").lower()
                            description = snippet.get("description", "").lower()
                            score = 0
                            for word in query_lower.split():
                                if len(word) < 3:
                                    continue
                                if word in title:
                                    score += 3
                                if word in description:
                                    score += 1
                            if not has_educational:
                                if any(kw in title or kw in description for kw in educational_keywords):
                                    score += 2
                            if score > best_score:
                                best_score = score
                                best_video = item

                        pick = best_video or items[0]
                        vid = pick.get("id", {}).get("videoId")
                        if vid:
                            sn = pick.get("snippet", {})
                            return {
                                "videoId": vid,
                                "title": sn.get("title", q),
                                "description": sn.get("description", ""),
                                "url": f"https://www.youtube.com/watch?v={vid}",
                            }
                except Exception as e:
                    print(f"⚠️ Error usando YouTube API: {e}, intentando scraping")

            if search_youtube_via_scrape:
                scraped = search_youtube_via_scrape(q)
                if scraped:
                    return scraped

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
                fallback_desc = description or query
                seed = requests.utils.quote((query or "study-agents-image")[:80])
                fallback_url = f"https://picsum.photos/seed/{seed}/1200/700"
                return (
                    f'\n\n![{fallback_desc}]({fallback_url})\n\n'
                    f'*💡 Imagen sugerida (fallback visual): {fallback_desc}*\n\n'
                )
        
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
    
    def generate_study_plan(
        self,
        topic: str,
        days: int = 7,
        minutes_per_day: int = 45,
        goal: Optional[str] = None,
        user_level: Optional[int] = None,
        model: Optional[str] = None,
        chat_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> tuple[str, dict]:
        """
        Genera un plan de estudio personalizado en Markdown (calendario, objetivos, técnicas).
        Opcionalmente usa fragmentos RAG del chat si hay documentos indexados.
        """
        topic = (topic or "").strip() or "Estudio general"
        days = max(1, min(int(days or 7), 90))
        minutes_per_day = max(5, min(int(minutes_per_day or 45), 240))
        level_display = int(user_level) if user_level is not None else 5
        level_display = max(0, min(level_display, 10))

        rag_text = ""
        if chat_id and user_id:
            try:
                chunks = self.memory.retrieve_relevant_content(
                    topic, n_results=4, chat_id=chat_id, user_id=user_id
                )
                if chunks:
                    rag_text = "\n\n---\n\n".join(chunks[:4])
                    if len(rag_text) > 6000:
                        rag_text = rag_text[:6000] + "\n\n[... documentos truncados ...]"
            except Exception as e:
                print(f"⚠️ generate_study_plan RAG: {e}")
        if not rag_text.strip():
            rag_text = "(No hay extractos de documentos en este chat; basa el plan en buenas prácticas de estudio y el tema.)"

        # Knowledge tracing: gaps + mastery para secuenciación adaptativa (F1.4)
        mastery_block = "(Sin grafo de conceptos aún; prioriza fundamentos del tema y retrieval practice.)"
        if chat_id:
            try:
                from core import concept_store

                gaps = concept_store.detect_gaps(chat_id, threshold=0.5)
                concepts = concept_store.concepts_with_mastery(chat_id)
                if concepts:
                    strong = [
                        c for c in concepts
                        if float(c.get("mastery") or 0) >= 0.7
                    ][:8]
                    lines = []
                    if gaps:
                        lines.append("### Gaps prioritarios (mastery < 0.5, por importancia)")
                        for g in gaps[:12]:
                            name = g.get("name") or g.get("concept_id")
                            m = float(g.get("mastery") or 0)
                            imp = g.get("importance", 0)
                            prereqs = g.get("broken_prerequisites") or []
                            extra = f" | prerreqs rotos: {', '.join(prereqs)}" if prereqs else ""
                            lines.append(f"- {name} (m={m:.2f}, deps={imp}){extra}")
                    if strong:
                        lines.append("### Ya razonablemente dominados (no sobrecargar)")
                        for c in strong:
                            name = c.get("name") or c.get("concept_id")
                            m = float(c.get("mastery") or 0)
                            lines.append(f"- {name} (m={m:.2f})")
                    avg = sum(float(c.get("mastery") or 0) for c in concepts) / len(concepts)
                    lines.append(f"### Mastery medio del chat: {avg:.2f}")
                    mastery_block = "\n".join(lines)
            except Exception as e:
                print(f"⚠️ generate_study_plan mastery: {e}")

        # Inicializar LLM (mismo criterio que apuntes: generación media)
        if self.model_manager:
            try:
                self.current_model_config, base_llm = self.model_manager.select_model(
                    task_type="generation",
                    min_quality="medium",
                    preferred_model=model if model else None,
                    context_length=6000,
                )
                if hasattr(base_llm, "temperature"):
                    base_llm.temperature = 0.75
                self.llm = base_llm
                print(
                    f"✅ Plan de estudio — modelo: {self.current_model_config.name}"
                )
            except Exception as e:
                print(f"⚠️ ModelManager plan estudio: {e}")
                if not self.api_key:
                    return (
                        f"# Error\n\nNo se pudo inicializar el modelo: {e}",
                        {"inputTokens": 0, "outputTokens": 0, "model": None},
                    )
                self.llm = ChatOpenAI(
                    model=model or "gpt-3.5-turbo",
                    temperature=0.75,
                    api_key=self.api_key,
                )
                self.current_model_config = None
        else:
            if not self.api_key:
                return (
                    "# Error\n\nSe requiere API key para generar el plan.",
                    {"inputTokens": 0, "outputTokens": 0, "model": None},
                )
            self.llm = ChatOpenAI(
                model=model or "gpt-3.5-turbo",
                temperature=0.75,
                api_key=self.api_key,
            )
            self.current_model_config = None

        goal_line = goal.strip() if goal else "Mejorar comprensión y retención del tema."

        # Curso diario Duolingo v3: INTRO visual → LEARN gráfico → TEST único
        max_days = max(1, min(int(days or 7), 30))
        if minutes_per_day <= 10:
            intro_n, teach_n, q_per_day = 3, 3, 2
        elif minutes_per_day <= 25:
            intro_n, teach_n, q_per_day = 3, 4, 3
        else:
            intro_n, teach_n, q_per_day = 4, 5, 3

        prompt = f"""Eres el diseñador pedagógico de un curso DIARIO estilo Duolingo (super gráfico, casi sin texto).
Devuelve SOLO un JSON válido (sin markdown, sin ```, sin prosa fuera del JSON).

## Contexto
- Tema del curso: {topic}
- Días: {max_days}
- Minutos/lección: {minutes_per_day}
- Nivel 0-10: {level_display}
- Objetivo: {goal_line}

## Dominio
{mastery_block}

## Material (si hay)
{rag_text[:3000]}

## Flujo OBLIGATORIO de cada día (3 actos)
1) intro — qué es / por qué importa HOY (muy visual, poco texto)
2) teach — lo más básico y práctico del foco del día (gráfico + 1 check)
3) questions — TEST FINAL solo sobre lo enseñado HOY (preguntas ÚNICAS)

## Esquema JSON
{{
  "format": "interactive_v3",
  "topic": "{topic}",
  "minutes_per_day": {minutes_per_day},
  "xp_per_correct": 10,
  "days": [
    {{
      "day": 1,
      "title": "máx 4 palabras",
      "focus": "1 micro-concepto concreto y distinto",
      "minutes": {minutes_per_day},
      "intro": [
        {{"id":"d1i1","kind":"bot_say","text":"frase corta del tutor (máx 90 chars)"}},
        {{"id":"d1i2","kind":"big_word","word":"1-2 PALABRAS","sub":"etiqueta corta"}},
        {{"id":"d1i3","kind":"chips","items":["chip1","chip2","chip3"]}},
        {{"id":"d1i4","kind":"html","html":"<div class='viz'><strong>Idea</strong><span>detalle mínimo</span></div>"}}
      ],
      "teach": [
        {{"id":"d1t1","kind":"bot_say","text":"vamos a lo práctico"}},
        {{"id":"d1t2","kind":"vs","left":{{"title":"Antes","body":"máx 40 chars"}},"right":{{"title":"Ahora","body":"máx 40 chars"}}}},
        {{"id":"d1t3","kind":"code","label":"Ejemplo","code":"código mínimo 1-3 líneas"}},
        {{"id":"d1t4","kind":"tap","prompt":"check inmediato","options":["A","B","C","D"],"correct_index":0,"feedback_ok":"ok","feedback_bad":"pista"}}
      ],
      "questions": [
        {{"id":"d1q1","prompt":"pregunta del TEST distinta a cualquier otra","options":["A","B","C","D"],"correct_index":0,"feedback_ok":"ok","feedback_bad":"pista"}}
      ]
    }}
  ]
}}

## Kinds permitidos
- bot_say: {{text}}
- big_word: {{word, sub?}}
- chips: {{items: 3-5 strings cortos}}
- vs: {{left:{{title,body}}, right:{{title,body}}}}
- steps: {{items: [{{n, label}}]}}  // 2-3 pasos
- code: {{label?, code}}
- html: {{html}} — SOLO tags: div,span,strong,em,code,pre,ul,ol,li,p,br,b,i. Sin scripts. Usa class viz/row/pill. Máx 400 chars.
- tap: igual que pregunta MCQ (check durante teach)
- card: {{title, body}} legacy (evitar si puedes)

## Reglas CRÍTICAS (anti-aburrido + anti-repetición)
- Exactamente {max_days} días. Cada día UN focus distinto y progresivo.
- Día 1 intro = qué es {topic} en esencia (no detalles avanzados).
- Cada día: ~{intro_n} bloques intro, ~{teach_n} teach (incluye exactamente 1 tap), {q_per_day} questions de test.
- TEXTOS CORTOS: bot_say ≤90 chars; body ≤50; word ≤18; sin párrafos.
- CERO muros de texto. Prioriza big_word, chips, vs, code, html visual.
- PROHIBIDO repetir el mismo prompt (ni similar) en teach taps ni en questions del CURSO ENTERO.
- PROHIBIDO preguntas genéricas tipo "¿qué es más preciso?" / "ítem 1".
- Cada question debe comprobar UN hecho concreto enseñado ese día.
- Opciones plausibles (distractores realistas). correct_index 0-3.
- Español. Sin emojis. Sin texto fuera del JSON.
"""
        try:
            import json

            response = self.llm.invoke(prompt)
            raw = response.content if hasattr(response, "content") else str(response)
            usage_info: Dict = {"inputTokens": 0, "outputTokens": 0, "model": None}
            if self.current_model_config:
                usage_info["model"] = self.current_model_config.name
            elif model:
                usage_info["model"] = model
            elif hasattr(self.llm, "model_name"):
                usage_info["model"] = self.llm.model_name
            else:
                usage_info["model"] = "gpt-3.5-turbo"
            if hasattr(response, "response_metadata") and response.response_metadata:
                tu = response.response_metadata.get("token_usage", {})
                usage_info["inputTokens"] = tu.get("prompt_tokens", 0)
                usage_info["outputTokens"] = tu.get("completion_tokens", 0)
            else:
                usage_info["inputTokens"] = len(prompt) // 4
                usage_info["outputTokens"] = len(raw) // 4

            plan_obj = self._parse_interactive_plan_json(
                raw, topic, max_days, minutes_per_day, q_per_day, teach_n, intro_n
            )
            return json.dumps(plan_obj, ensure_ascii=False), usage_info
        except Exception as e:
            return (
                f"# Error\n\nNo se pudo generar el plan: {e}",
                {"inputTokens": 0, "outputTokens": 0, "model": None},
            )

    def _parse_interactive_plan_json(
        self,
        raw: str,
        topic: str,
        max_days: int,
        minutes_per_day: int,
        q_per_day: int,
        teach_per_day: int = 3,
        intro_per_day: int = 3,
    ) -> dict:
        """Parsea JSON v3 (intro/teach/test); deduplica prompts; esqueleto si falla."""
        import json
        import re

        text = (raw or "").strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            text = m.group(0)
        try:
            data = json.loads(text)
        except Exception:
            data = {}

        seen_prompts: set = set()

        def _norm_prompt(s: str) -> str:
            s = re.sub(r"\s+", " ", (s or "").lower().strip())
            s = re.sub(r"[¿?¡!.,;:\"']", "", s)
            return s[:160]

        def _sanitize_html(raw_html: str) -> str:
            allowed = {"div", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "p", "br", "b", "i"}
            # strip tags not in allowlist (simple)
            cleaned = re.sub(
                r"</?(?!/?(?:" + "|".join(allowed) + r")\b)[^>]*>",
                "",
                raw_html or "",
                flags=re.I,
            )
            cleaned = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", cleaned, flags=re.I)
            cleaned = re.sub(r"javascript:", "", cleaned, flags=re.I)
            return cleaned[:500]

        def _parse_mcq(q: dict, fallback_id: str, *, allow_dup: bool = False) -> Optional[dict]:
            if not isinstance(q, dict):
                return None
            opts = q.get("options") or []
            if not isinstance(opts, list) or len(opts) < 2:
                return None
            opts = [str(o)[:80] for o in opts[:4]]
            while len(opts) < 4:
                opts.append(f"Opción {len(opts)+1}")
            # uniquify options within question
            seen_o = set()
            uniq_opts = []
            for o in opts:
                key = o.lower().strip()
                if key in seen_o:
                    o = f"{o} *"
                seen_o.add(o.lower().strip())
                uniq_opts.append(o)
            opts = uniq_opts
            try:
                ci = int(q.get("correct_index", 0))
            except Exception:
                ci = 0
            ci = max(0, min(ci, len(opts) - 1))
            prompt = str(q.get("prompt") or "Pregunta").strip()[:220]
            np = _norm_prompt(prompt)
            if not allow_dup and np in seen_prompts:
                return None
            if np:
                seen_prompts.add(np)
            return {
                "id": str(q.get("id") or fallback_id),
                "prompt": prompt,
                "options": opts,
                "correct_index": ci,
                "feedback_ok": str(q.get("feedback_ok") or "¡Bien!").strip()[:120],
                "feedback_bad": str(
                    q.get("feedback_bad") or f"Era: {opts[ci]}"
                ).strip()[:160],
            }

        def _parse_block(t: dict, fallback_id: str, focus: str) -> Optional[dict]:
            if not isinstance(t, dict):
                return None
            kind = str(t.get("kind") or "card").lower().strip()
            bid = str(t.get("id") or fallback_id)

            if kind == "tap":
                mcq = _parse_mcq(t, bid)
                if not mcq:
                    return None
                return {"kind": "tap", **mcq}

            if kind == "bot_say":
                txt = str(t.get("text") or t.get("body") or "").strip()[:90]
                if not txt:
                    txt = f"Hoy: {focus}"
                return {"id": bid, "kind": "bot_say", "text": txt}

            if kind == "big_word":
                word = str(t.get("word") or t.get("title") or focus).strip()[:24]
                sub = str(t.get("sub") or t.get("body") or "").strip()[:60]
                return {"id": bid, "kind": "big_word", "word": word, "sub": sub}

            if kind == "chips":
                items = t.get("items") or t.get("chips") or []
                if not isinstance(items, list):
                    items = []
                items = [str(x).strip()[:28] for x in items if str(x).strip()][:5]
                if len(items) < 2:
                    items = [focus, "práctica", "retención"][:3]
                return {"id": bid, "kind": "chips", "items": items}

            if kind == "vs":
                left = t.get("left") if isinstance(t.get("left"), dict) else {}
                right = t.get("right") if isinstance(t.get("right"), dict) else {}
                return {
                    "id": bid,
                    "kind": "vs",
                    "left": {
                        "title": str(left.get("title") or "A").strip()[:24],
                        "body": str(left.get("body") or "").strip()[:60],
                    },
                    "right": {
                        "title": str(right.get("title") or "B").strip()[:24],
                        "body": str(right.get("body") or "").strip()[:60],
                    },
                }

            if kind == "steps":
                items = t.get("items") or []
                out_items = []
                if isinstance(items, list):
                    for idx, it in enumerate(items[:3]):
                        if isinstance(it, dict):
                            out_items.append({
                                "n": int(it.get("n") or (idx + 1)),
                                "label": str(it.get("label") or it.get("text") or "").strip()[:50],
                            })
                        else:
                            out_items.append({"n": idx + 1, "label": str(it).strip()[:50]})
                if not out_items:
                    out_items = [{"n": 1, "label": focus}]
                return {"id": bid, "kind": "steps", "items": out_items}

            if kind == "code":
                code = str(t.get("code") or "").strip()[:220]
                if not code:
                    code = f"// {focus}"
                return {
                    "id": bid,
                    "kind": "code",
                    "label": str(t.get("label") or "Ejemplo").strip()[:24],
                    "code": code,
                }

            if kind == "html":
                return {
                    "id": bid,
                    "kind": "html",
                    "html": _sanitize_html(str(t.get("html") or t.get("body") or "")),
                }

            # card / default
            body = str(t.get("body") or t.get("text") or "").strip()
            if not body:
                body = f"Hoy: {focus}"
            return {
                "id": bid,
                "kind": "card",
                "title": str(t.get("title") or "Idea").strip()[:40],
                "body": body[:160],
            }

        def _default_intro(day_i: int, focus: str) -> list:
            if day_i == 1:
                return [
                    {"id": f"d{day_i}i1", "kind": "bot_say", "text": f"Hoy empiezas {topic}. Poco texto, mucha práctica."},
                    {"id": f"d{day_i}i2", "kind": "big_word", "word": topic[:18], "sub": "qué es, en una idea"},
                    {"id": f"d{day_i}i3", "kind": "chips", "items": [focus, "bases", "práctica"]},
                ]
            return [
                {"id": f"d{day_i}i1", "kind": "bot_say", "text": f"Día {day_i}: {focus}"},
                {"id": f"d{day_i}i2", "kind": "big_word", "word": focus[:18], "sub": "foco de hoy"},
                {"id": f"d{day_i}i3", "kind": "chips", "items": ["ver", "tocar", "test"]},
            ]

        def _default_teach(day_i: int, focus: str) -> list:
            return [
                {"id": f"d{day_i}t1", "kind": "bot_say", "text": f"Lo básico de {focus}"},
                {
                    "id": f"d{day_i}t2",
                    "kind": "vs",
                    "left": {"title": "Confusión", "body": "Memorizar párrafos"},
                    "right": {"title": "Hoy", "body": f"Practicar {focus}"},
                },
                {
                    "id": f"d{day_i}t3",
                    "kind": "tap",
                    "prompt": f"¿Qué practicas hoy sobre {focus}?",
                    "options": [
                        f"El concepto {focus}",
                        "Un tema distinto",
                        "Solo leer sin practicar",
                        "Saltar al final",
                    ],
                    "correct_index": 0,
                    "feedback_ok": "Eso es.",
                    "feedback_bad": f"Hoy toca {focus}.",
                },
            ]

        def _unique_question(day_i: int, j: int, focus: str) -> dict:
            variants = [
                (f"En {focus}, ¿qué es lo esencial?", [f"La idea central de {focus}", "Un detalle irrelevante", "Memorizar el índice", "Ignorar la práctica"]),
                (f"Si aplicas {focus} bien, ¿qué ganas?", ["Claridad práctica", "Más texto que leer", "Confusión", "Nada"]),
                (f"¿Cuál NO encaja con {focus}?", ["Concepto opuesto", f"Uso típico de {focus}", f"Definición de {focus}", f"Ejemplo de {focus}"]),
            ]
            prompt, opts = variants[(day_i + j) % len(variants)]
            # force uniqueness
            prompt = f"{prompt} (d{day_i}.{j})"
            np = _norm_prompt(prompt)
            seen_prompts.add(np)
            return {
                "id": f"d{day_i}q{j}",
                "prompt": prompt.replace(f" (d{day_i}.{j})", ""),
                "options": opts,
                "correct_index": 0,
                "feedback_ok": "Correcto.",
                "feedback_bad": f"Repasa {focus}.",
            }

        days_in = data.get("days") if isinstance(data, dict) else None
        days_out = []
        if isinstance(days_in, list):
            for i, d in enumerate(days_in[:max_days]):
                if not isinstance(d, dict):
                    continue
                day_num = int(d.get("day") or (i + 1))
                focus = str(d.get("focus") or topic).strip()[:80]
                intro = []
                for j, t in enumerate((d.get("intro") or [])[:intro_per_day + 1]):
                    parsed = _parse_block(t, f"d{day_num}i{j+1}", focus)
                    if parsed:
                        intro.append(parsed)
                teach = []
                for j, t in enumerate((d.get("teach") or [])[:teach_per_day + 1]):
                    parsed = _parse_block(t, f"d{day_num}t{j+1}", focus)
                    if parsed:
                        teach.append(parsed)
                qs = []
                for j, q in enumerate((d.get("questions") or [])[: q_per_day + 2]):
                    parsed_q = _parse_mcq(q, f"d{day_num}q{j+1}")
                    if parsed_q:
                        qs.append(parsed_q)
                    if len(qs) >= q_per_day:
                        break

                if not intro:
                    intro = _default_intro(day_num, focus)
                if not teach:
                    teach = _default_teach(day_num, focus)
                # ensure one tap in teach
                if not any(x.get("kind") == "tap" for x in teach):
                    teach.append(_default_teach(day_num, focus)[-1])
                while len(qs) < q_per_day:
                    qs.append(_unique_question(day_num, len(qs) + 1, focus))

                days_out.append({
                    "day": day_num,
                    "title": str(d.get("title") or f"Día {day_num}").strip()[:48],
                    "focus": focus,
                    "minutes": int(d.get("minutes") or minutes_per_day),
                    "intro": intro,
                    "teach": teach,
                    "questions": qs[:q_per_day],
                })

        if len(days_out) < max_days:
            for i in range(len(days_out) + 1, max_days + 1):
                focus = f"{topic} · unidad {i}"
                qs = [_unique_question(i, j, focus) for j in range(1, q_per_day + 1)]
                days_out.append({
                    "day": i,
                    "title": f"Unidad {i}",
                    "focus": focus[:80],
                    "minutes": minutes_per_day,
                    "intro": _default_intro(i, focus),
                    "teach": _default_teach(i, focus),
                    "questions": qs,
                })

        return {
            "format": "interactive_v3",
            "topic": str((data.get("topic") if isinstance(data, dict) else None) or topic),
            "minutes_per_day": minutes_per_day,
            "xp_per_correct": int(
                (data.get("xp_per_correct") if isinstance(data, dict) else None) or 10
            ),
            "days": days_out[:max_days],
        }

    def generate_notes(self, topics: Optional[List[str]] = None, model: Optional[str] = None, user_level: Optional[int] = None, conversation_history: Optional[List[dict]] = None, topic: Optional[str] = None, chat_id: Optional[str] = None, user_id: Optional[str] = None) -> tuple[str, dict]:
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
        prompt_template = r"""Eres un Arquitecto de Conocimiento experto en crear 'Hojas de Estudio de Alto Rendimiento'.

Tu objetivo NO es resumir, sino destilar la información para que sea memorizable al instante.

**🚨 CRÍTICO - DETECCIÓN DE TEMARIOS:**
Si el contenido fuente es un TEMARIO (lista de temas de examen/oposición), NO generes apuntes sobre "el temario", "qué temas entran" o "el contenido del examen". 
En su lugar, genera contenido educativo COMPLETO sobre CADA UNO de los temas listados. 
Crea apuntes detallados que cubran el contenido real de cada tema, como si fueras a enseñar ese tema desde cero.
Si hay múltiples temas, organiza el contenido por tema y cubre todos los temas listados con su contenido educativo completo.

{language_instruction}

### 🎲 VARIACIÓN Y ORIGINALIDAD (IMPORTANTE):

**CRÍTICO**: Cada vez que generes apuntes, varía el contenido significativamente:
- Usa diferentes ejemplos, palabras y frases
- Cambia el orden de los conceptos presentados
- Incluye contenido diferente pero igualmente relevante y útil
- NO repitas exactamente el mismo contenido de generaciones anteriores
- Si es un idioma, incluye vocabulario y frases diferentes cada vez
- Varía los ejemplos prácticos y casos de uso
- Presenta la información desde diferentes ángulos o enfoques

CONTENIDO FUENTE:
{content}

---

### 🧠 REGLAS DE ORO (STYLE GUIDE):

1. **CERO RELLENO:** Prohibido usar frases introductorias como "En este documento...", "A continuación...", "Es importante notar que...". Ve directo al dato.

2. **FORMATO ATÓMICO:** Usa Bullet points (•) para todo. Párrafos de máximo 2 líneas.

3. **VISUAL:** Usa **Negritas** para conceptos clave y `código` para términos técnicos.

4. **NO MERMAID:** Absolutamente prohibido usar bloques ```mermaid. Si necesitas un diagrama, usa SOLO el formato JSON especificado abajo.

### 📊 ADAPTACIÓN AL NIVEL (CRÍTICO - OBLIGATORIO):

**NIVEL ACTUAL DEL ESTUDIANTE: {user_level}/10**

{level_note}

**DEBES ADAPTAR ESTRICTAMENTE TODO EL CONTENIDO AL NIVEL {user_level}/10. NO uses contenido de otros niveles.**

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
            import re
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
        # CRÍTICO: priorizar corpus del chat (PDF indexado). Antes, si venía `topic`
        # (a menudo el nombre del PDF), se ignoraba el documento y se inventaban apuntes.
        chat_corpus = ""
        if chat_id and user_id:
            try:
                chat_corpus = self.memory.get_chat_corpus_text(
                    chat_id, user_id, max_chars=24000
                )
                if chat_corpus and chat_corpus.strip():
                    print(f"📄 Corpus del chat para apuntes: {len(chat_corpus)} chars")
                else:
                    # Fallback semántico por si get() falla / vacío
                    query = None
                    if final_topics:
                        query = (
                            final_topics[0]
                            if isinstance(final_topics, list)
                            else str(final_topics)
                        )
                    if not query or query.lower().endswith(".pdf"):
                        query = "contenido principal del documento conceptos definiciones"
                    chunks = self.memory.retrieve_relevant_content(
                        query, n_results=15, chat_id=chat_id, user_id=user_id
                    )
                    if chunks:
                        chat_corpus = "\n\n---\n\n".join(chunks)
                        print(f"📄 RAG retrieve para apuntes: {len(chunks)} chunks")
            except Exception as e:
                print(f"⚠️ No se pudo cargar corpus del chat: {e}")

        def _looks_like_filename(value: str) -> bool:
            v = (value or "").strip().lower()
            return bool(
                v.endswith(".pdf")
                or v.endswith(".png")
                or v.endswith(".jpg")
                or v.endswith(".jpeg")
                or v.endswith(".webp")
                or " (" in v and v.endswith(")")
            )

        # Si el "tema" es solo el nombre del archivo, no sirve como fuente educativa
        topic_is_filename = False
        if final_topics:
            first = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
            topic_is_filename = _looks_like_filename(str(first))

        all_content = []
        if chat_corpus and chat_corpus.strip():
            all_content = [chat_corpus]
        else:
            # Legacy: sin chat_id — colección global (evitar en producción multi-chat)
            all_content = self.memory.get_all_documents(limit=50)

        syllabus_topics = None
        if all_content:
            combined_doc_content = "\n\n".join(all_content[:10])
            syllabus_topics = detect_and_extract_topics_from_syllabus(combined_doc_content)
            
            if syllabus_topics:
                print(f"📋 TEMARIO DETECTADO: Se encontraron {len(syllabus_topics)} temas en el documento")
                print(f"📋 Primeros temas: {', '.join(syllabus_topics[:5])}")
                if not final_topics or (len(final_topics) == 1 and final_topics[0].lower() in ["temario", "temas", "contenido"]):
                    final_topics = syllabus_topics
                    print(f"✅ Usando temas del temario para generar contenido educativo")
        
        combined_content = ""

        # 1) Siempre preferir el PDF/corpus indexado del chat
        if chat_corpus and chat_corpus.strip():
            print("📄 Generando apuntes desde el documento indexado del chat (no solo el título)")
            combined_content = chat_corpus
            if conversation_text:
                combined_content += f"\n\n---\n\nHISTORIAL DE CONVERSACIÓN (contexto):\n{conversation_text}"
            if final_topics and not topic_is_filename:
                topics_hint = (
                    ", ".join(final_topics[:8])
                    if isinstance(final_topics, list)
                    else str(final_topics)
                )
                combined_content = (
                    f"FOCO DEL ESTUDIANTE: {topics_hint}\n\n"
                    f"Usa PRIORITARIAMENTE el CONTENIDO FUENTE del documento. "
                    f"No inventes material ajeno al PDF.\n\n---\n\n{combined_content}"
                )
        elif final_topics and not topic_is_filename:
            # 2) Sin PDF: generar por tema educativo real (no filename)
            if has_relevant_conversation:
                combined_content = conversation_text
                print(f"📝 Usando historial de conversación sobre '{final_topics[0]}'")
            else:
                if conversation_text:
                    print(f"📝 Historial no relevante para '{final_topics[0]}', generando desde cero con el tema")
                else:
                    print(f"📝 Sin documentos ni historial; generando desde cero para '{final_topics[0]}'")
                
                if isinstance(final_topics, list) and len(final_topics) > 1:
                    topics_list = "\n".join([f"- {t}" for t in final_topics[:15]])
                    combined_content = f"TEMARIO - TEMAS A PREPARAR:\n\n{topics_list}\n\n🚨 INSTRUCCIÓN CRÍTICA: El usuario quiere preparar estos temas de una oposición/examen. NO generes contenido sobre 'el temario' o 'qué temas entran'. En su lugar, genera contenido educativo COMPLETO sobre CADA UNO de estos temas. Crea apuntes detallados que cubran el contenido real de cada tema, como si fueras a enseñar ese tema desde cero. Organiza el contenido por tema y cubre todos los temas listados."
                else:
                    main_topic = final_topics[0] if isinstance(final_topics, list) else str(final_topics)
                    combined_content = f"TEMA: {main_topic}\n\nEste resumen se generará basándose en el conocimiento educativo sobre {main_topic}, adaptado al nivel del estudiante."
                
                if conversation_text:
                    combined_content += f"\n\n---\n\nHISTORIAL DE CONVERSACIÓN (contexto adicional):\n{conversation_text}"
        else:
            # 3) Fallback: documentos globales o historial
            if not all_content:
                all_content = self.memory.get_all_documents(limit=100)
            
            if conversation_text and (not all_content or len(all_content) == 0):
                print("📝 Usando solo historial de conversación (no hay documentos)")
                combined_content = conversation_text
            elif not all_content or len(all_content) == 0:
                if not conversation_text:
                    print("❌ No hay documentos en la memoria ni historial de conversación")
                    return "# Resumen\n\n⚠️ No hay contenido disponible. Por favor, sube documentos o inicia una conversación primero."
                else:
                    combined_content = conversation_text
            else:
                all_content = [doc for doc in all_content if doc and doc.strip() and len(doc.strip()) > 10]
                
                if not all_content or len(all_content) == 0:
                    if conversation_text:
                        print("📝 Usando solo historial de conversación (documentos vacíos)")
                        combined_content = conversation_text
                    else:
                        print("❌ Todos los documentos están vacíos o son muy cortos")
                        return "# Resumen\n\n⚠️ Los documentos procesados no contienen suficiente contenido. Por favor, sube documentos con más texto."
                else:
                    print(f"📄 Encontrados {len(all_content)} documentos con contenido válido")
                    print(f"📄 Primer documento (primeros 200 chars): {all_content[0][:200]}...")
                    
                    try:
                        encoding = tiktoken.encoding_for_model("gpt-4")
                    except Exception:
                        encoding = tiktoken.get_encoding("cl100k_base")
                    
                    MAX_CONTENT_TOKENS = 8000
                    combined_content = ""
                    combined_tokens = 0
                    
                    prompt_base_tokens = len(encoding.encode(prompt_template.replace("{content}", "")))
                    print(f"📊 Tokens del prompt base: {prompt_base_tokens}")
                    print(f"📊 Límite de tokens para contenido: {MAX_CONTENT_TOKENS}")
                    
                    if conversation_text:
                        hist_tokens = len(encoding.encode(conversation_text))
                        if hist_tokens + prompt_base_tokens <= MAX_CONTENT_TOKENS:
                            combined_content = conversation_text
                            combined_tokens = hist_tokens
                            print(f"📝 Historial añadido ({hist_tokens} tokens)")
                    
                    for i, doc in enumerate(all_content):
                        doc_text = f"\n\n---\n\n{doc}" if combined_content else doc
                        doc_tokens = len(encoding.encode(doc_text))
                        
                        if combined_tokens + doc_tokens + prompt_base_tokens > MAX_CONTENT_TOKENS:
                            print(f"📊 Límite alcanzado después de {i} documentos ({combined_tokens} tokens)")
                            combined_content += f"\n\n---\n\n[Nota: Hay más contenido disponible. Se han incluido {i} documentos de {len(all_content)} disponibles. Para ver todo, puedes hacer preguntas específicas sobre temas concretos.]"
                            break
                        combined_content += doc_text
                        combined_tokens += doc_tokens
                        print(f"📄 Documento {i+1} añadido ({doc_tokens} tokens, total: {combined_tokens})")
                    
                    print(f"📊 Contenido final: {combined_tokens} tokens, {len(combined_content)} caracteres")

        if topic_is_filename and (not chat_corpus or not chat_corpus.strip()) and (
            not combined_content or combined_content.strip().startswith("TEMA:")
        ):
            return (
                "# Resumen\n\n⚠️ Hay un PDF en el chat pero **no está indexado en la memoria** "
                "(o el backend no tiene los chunks). Vuelve a subir el documento y espera a "
                "«Documento procesado». Si el problema continúa, redeploy del backend Railway."
            )
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
        if user_level is not None:
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
            import re
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
        
        final_prompt = prompt_template.replace("{content}", combined_content).replace("{level_note}", level_note).replace("{topic_name}", topic_name).replace("{language_instruction}", language_instruction).replace("{user_level}", str(user_level_display))
        if is_language_topic and language_name:
            final_prompt = final_prompt.replace("{language_name}", language_name)
        else:
            final_prompt = final_prompt.replace("{language_name}", "el idioma objetivo")
        
        prompt = final_prompt

        try:
            print("🔄 Invocando LLM para generar apuntes...")
            response = self.llm.invoke(prompt)
            notes_content = response.content
            print(f"✅ Respuesta recibida: {len(notes_content)} caracteres")
            print(f"📄 Primeros 300 caracteres: {notes_content[:300]}")
            
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
            import re
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
