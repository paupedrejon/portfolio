"""
Generador de resúmenes/apuntes usando Google Gemini API
Genera apuntes de la academia para cada apartado y subapartado de un curso
"""

import os
import requests
import json
from typing import List, Dict, Optional
from pathlib import Path
import io
from threading import Lock
import re

# Intentar importar markdown para conversión
try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False
    print("⚠️ markdown no está instalado. Instálalo con: pip install markdown")

# Sistema de tracking de progreso en memoria
_progress_tracker: Dict[str, Dict] = {}
_progress_lock = Lock()

# Intentar importar PyPDF2, si no está disponible usar alternativa
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("⚠️ PyPDF2 no está instalado. Instálalo con: pip install PyPDF2")


def _is_technical_diagram(description: str) -> bool:
    """
    Detecta si la descripción requiere un diagrama técnico/educativo
    en lugar de una foto general
    """
    technical_keywords = [
        "diagrama", "esquema", "estructura", "algoritmo", "flujo",
        "árbol", "tree", "índice", "index", "base de datos", "database",
        "sql", "query", "tabla", "table", "relación", "relational",
        "hash", "clustered", "b-tree", "b+tree", "nodo", "node",
        "comparación", "comparison", "visual", "técnico", "technical",
        "arquitectura", "architecture", "modelo", "model", "red", "network",
        "protocolo", "protocol", "algoritmo", "algorithm", "gráfico", "graph",
        "visualización", "visualization", "representación", "representation"
    ]
    
    description_lower = description.lower()
    return any(keyword in description_lower for keyword in technical_keywords)


def _generate_image_with_dalle(description: str, api_key: str) -> Optional[Dict[str, str]]:
    """
    Genera una imagen usando DALL-E (OpenAI) basándose en la descripción
    
    Args:
        description: Descripción de la imagen a generar
        api_key: API key de OpenAI
        
    Returns:
        Dict con 'url' (local path) y 'description' o None si falla
    """
    try:
        from datetime import datetime
        import hashlib
        
        # Crear un prompt mejorado para DALL-E basado en la descripción
        # Asegurar que sea educativo y técnico
        prompt = f"Educational technical diagram: {description}. Clean, professional diagram style with clear labels and structure. Suitable for academic learning material."
        
        print(f"🎨 Generando imagen con DALL-E para: '{description[:80]}...'")
        
        # Llamar a la API de DALL-E
        url = "https://api.openai.com/v1/images/generations"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1024x1024",
            "quality": "standard",
            "response_format": "url"  # Obtener URL directamente
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if "data" in result and len(result["data"]) > 0:
                image_url = result["data"][0]["url"]
                
                # Descargar la imagen y guardarla localmente
                print(f"📥 Descargando imagen generada...")
                image_response = requests.get(image_url, timeout=60)
                if image_response.status_code == 200:
                    # Crear directorio para imágenes generadas
                    images_dir = Path("courses/generated_images")
                    images_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Generar nombre único para la imagen
                    hash_obj = hashlib.md5(description.encode())
                    image_hash = hash_obj.hexdigest()[:12]
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    image_filename = f"dalle_{timestamp}_{image_hash}.png"
                    image_path = images_dir / image_filename
                    
                    # Guardar la imagen
                    with open(image_path, "wb") as f:
                        f.write(image_response.content)
                    
                    # Retornar URL relativa que se puede servir desde el backend
                    relative_url = f"/api/files/generated_images/{image_filename}"
                    print(f"✅ Imagen generada y guardada: {relative_url}")
                    
                    return {
                        "url": relative_url,
                        "description": description,
                        "local_path": str(image_path)
                    }
        else:
            error_data = response.json() if response.content else {}
            error_msg = error_data.get('error', {}).get('message', 'Unknown error') if isinstance(error_data, dict) else str(error_data)
            print(f"⚠️ Error generando imagen con DALL-E: {response.status_code} - {error_msg}")
            
    except Exception as e:
        print(f"⚠️ Error generando imagen con DALL-E: {e}")
        import traceback
        traceback.print_exc()
    
    return None


def _search_wikimedia_commons(query: str) -> Optional[Dict[str, str]]:
    """
    Busca imágenes/diagramas en Wikimedia Commons (ideal para contenido educativo)
    """
    try:
        # Buscar en Wikimedia Commons API
        search_url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srnamespace": 6,  # Namespace de archivos
            "srlimit": 5,
            "srprop": "size|wordcount|timestamp",
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "query" in data and "search" in data["query"]:
                results = data["query"]["search"]
                if results:
                    # Obtener información del primer resultado
                    first_result = results[0]
                    title = first_result["title"]
                    
                    # Obtener URL de la imagen
                    image_info_params = {
                        "action": "query",
                        "format": "json",
                        "titles": title,
                        "prop": "imageinfo",
                        "iiprop": "url",
                        "iiurlwidth": 800,
                    }
                    
                    image_info_response = requests.get(search_url, params=image_info_params, timeout=10)
                    if image_info_response.status_code == 200:
                        image_data = image_info_response.json()
                        if "query" in image_data and "pages" in image_data["query"]:
                            pages = image_data["query"]["pages"]
                            for page_id, page_data in pages.items():
                                if "imageinfo" in page_data and len(page_data["imageinfo"]) > 0:
                                    image_url = page_data["imageinfo"][0].get("url")
                                    if image_url:
                                        print(f"✅ Imagen encontrada en Wikimedia Commons: {title}")
                                        return {
                                            "url": image_url,
                                            "description": query
                                        }
    except Exception as e:
        print(f"⚠️ Error buscando en Wikimedia Commons: {e}")
    
    return None


def search_image(query: str) -> Optional[Dict[str, str]]:
    """
    Genera o busca una imagen relevante, priorizando generación con DALL-E para contenido educativo
    
    Args:
        query: Descripción de la imagen a generar/buscar
        
    Returns:
        Dict con 'url' y 'description' o None si no se encuentra/genera
    """
    is_technical = _is_technical_diagram(query)
    
    # PRIORIDAD 1: Intentar generar con DALL-E si hay API key de OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print(f"🎨 Intentando generar imagen con DALL-E para: '{query[:60]}...'")
        try:
            dalle_result = _generate_image_with_dalle(query, openai_key)
            if dalle_result:
                print(f"✅ Imagen generada exitosamente con DALL-E")
                return dalle_result
            else:
                print(f"⚠️ DALL-E no pudo generar la imagen, intentando otras fuentes...")
        except Exception as e:
            print(f"⚠️ Error con DALL-E: {e}, intentando otras fuentes...")
    else:
        print(f"ℹ️ OPENAI_API_KEY no configurada, saltando generación con DALL-E")
    
    # PRIORIDAD 2: Si es un diagrama técnico, buscar en Wikimedia Commons
    if is_technical:
        print(f"🔍 Detectado diagrama técnico, buscando en Wikimedia Commons...")
        wikimedia_result = _search_wikimedia_commons(query)
        if wikimedia_result:
            return wikimedia_result
        
        # También intentar con términos más específicos en Unsplash/Pexels
        # Agregar términos como "diagram", "technical", "educational" a la búsqueda
        enhanced_query = f"{query} diagram technical educational"
    else:
        enhanced_query = query
    
    try:
        # Intentar con Unsplash
        unsplash_key = os.getenv("UNSPLASH_ACCESS_KEY")
        if unsplash_key:
            unsplash_url = f"https://api.unsplash.com/search/photos?query={enhanced_query}&per_page=5&orientation=landscape"
            headers = {"Authorization": f"Client-ID {unsplash_key}"}
            response = requests.get(unsplash_url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    # Para diagramas técnicos, buscar resultados más relevantes
                    # Revisar los primeros resultados para encontrar el más relevante
                    for photo in data["results"][:3]:
                        photo_desc = (photo.get("description") or photo.get("alt_description") or "").lower()
                        # Si es técnico y la descripción no contiene palabras técnicas, saltar
                        if is_technical:
                            if not any(word in photo_desc for word in ["diagram", "chart", "graph", "technical", "structure", "schema", "tree", "index", "database"]):
                                continue
                        
                        image_url = photo["urls"]["regular"]
                        if image_url:
                            return {
                                "url": image_url,
                                "description": photo.get("description") or photo.get("alt_description") or query
                            }
        
        # Fallback a Pexels
        pexels_key = os.getenv("PEXELS_API_KEY")
        if pexels_key:
            pexels_url = f"https://api.pexels.com/v1/search?query={enhanced_query}&per_page=5&orientation=landscape"
            headers = {"Authorization": pexels_key}
            response = requests.get(pexels_url, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("photos") and len(data["photos"]) > 0:
                    for photo in data["photos"][:3]:
                        photo_alt = (photo.get("alt") or "").lower()
                        # Si es técnico y la descripción no contiene palabras técnicas, saltar
                        if is_technical:
                            if not any(word in photo_alt for word in ["diagram", "chart", "graph", "technical", "structure", "schema", "tree", "index", "database"]):
                                continue
                        
                        image_url = photo["src"]["large"]
                        if image_url:
                            return {
                                "url": image_url,
                                "description": photo.get("alt") or query
                            }
    except Exception as e:
        print(f"⚠️ Error buscando imagen: {e}")
    
    return None


def _process_math_in_markdown(content: str) -> str:
    """
    Procesa fórmulas matemáticas LaTeX en Markdown antes de convertir a HTML
    Convierte $...$ y $$...$$ a HTML con estilos
    """
    processed = content
    
    # Procesar bloques $$...$$ primero (más específico)
    block_placeholders = []
    def replace_block(match):
        formula = match.group(1).strip()
        placeholder = f"__MATH_BLOCK_{len(block_placeholders)}__"
        block_placeholders.append(formula)
        return placeholder
    
    processed = re.sub(r'\$\$([^$]+)\$\$', replace_block, processed)
    
    # Procesar inline $...$ (evitar los que ya fueron procesados)
    inline_placeholders = []
    def replace_inline(match):
        formula = match.group(1).strip()
        placeholder = f"__MATH_INLINE_{len(inline_placeholders)}__"
        inline_placeholders.append(formula)
        return placeholder
    
    processed = re.sub(r'\$([^$\n]+?)\$', replace_inline, processed)
    
    # Reemplazar placeholders con HTML
    for i, formula in enumerate(block_placeholders):
        processed = processed.replace(
            f"__MATH_BLOCK_{i}__",
            f'<div class="math-block" style="text-align: center; margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; font-family: \'Courier New\', monospace; font-size: 1.1em;">${formula}$</div>'
        )
    
    for i, formula in enumerate(inline_placeholders):
        processed = processed.replace(
            f"__MATH_INLINE_{i}__",
            f'<span class="math-inline" style="font-family: \'Courier New\', monospace; background: rgba(99, 102, 241, 0.15); padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.95em;">${formula}$</span>'
        )
    
    return processed


def _markdown_to_html(content: str) -> str:
    """
    Convierte Markdown a HTML, procesando fórmulas matemáticas primero
    
    Args:
        content: Contenido en Markdown
        
    Returns:
        Contenido en HTML
    """
    # Procesar fórmulas matemáticas antes de convertir Markdown
    content = _process_math_in_markdown(content)
    
    if not MARKDOWN_AVAILABLE:
        # Fallback básico: convertir solo los elementos más comunes
        # Convertir **texto** a <strong>texto</strong>
        content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', content)
        # Convertir *texto* a <em>texto</em> (solo si no está dentro de **)
        content = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', content)
        # Convertir ### Título a <h3>Título</h3>
        content = re.sub(r'^###\s+(.+?)$', r'<h3>\1</h3>', content, flags=re.MULTILINE)
        # Convertir ## Título a <h2>Título</h2>
        content = re.sub(r'^##\s+(.+?)$', r'<h2>\1</h2>', content, flags=re.MULTILINE)
        # Convertir # Título a <h1>Título</h1>
        content = re.sub(r'^#\s+(.+?)$', r'<h1>\1</h1>', content, flags=re.MULTILINE)
        # Convertir listas con - o * a <ul><li>
        lines = content.split('\n')
        in_list = False
        result_lines = []
        for line in lines:
            stripped = line.strip()
            # Detectar listas (pueden tener espacios antes)
            list_match = re.match(r'^(\s*)[-*]\s+(.+)$', stripped)
            if list_match:
                if not in_list:
                    result_lines.append('<ul>')
                    in_list = True
                item_text = list_match.group(2).strip()
                # Procesar negritas dentro de los items de lista
                item_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', item_text)
                result_lines.append(f'<li>{item_text}</li>')
            else:
                if in_list:
                    result_lines.append('</ul>')
                    in_list = False
                if stripped:  # Solo añadir líneas no vacías
                    # Si ya es HTML, no envolver en <p>
                    if stripped.startswith('<'):
                        result_lines.append(line)
                    else:
                        # Procesar negritas en párrafos normales
                        processed_line = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line)
                        result_lines.append(f'<p>{processed_line}</p>')
        if in_list:
            result_lines.append('</ul>')
        content = '\n'.join(result_lines)
        return content
    else:
        # Usar la librería markdown
        md = markdown.Markdown(extensions=['extra', 'nl2br', 'sane_lists'])
        return md.convert(content)


def _process_image_markers(content: str) -> str:
    """
    Procesa marcadores de imagen 🖼️ [INSERTAR IMAGEN: ...] y los reemplaza con imágenes reales
    
    Args:
        content: Contenido con marcadores de imagen
        
    Returns:
        Contenido con imágenes insertadas
    """
    # Patrón para detectar marcadores de imagen (multilínea)
    # Formato: > 🖼️ [INSERTAR IMAGEN: Descripción]
    # También puede estar dentro de bloques HTML como <blockquote> o <p>
    # Buscar el marcador incluso si está dentro de tags HTML
    image_pattern = r'(?:>|&gt;)\s*🖼️\s*\[INSERTAR IMAGEN:\s*([^\]]+?)\]'
    
    def replace_image_marker(match):
        description = match.group(1).strip()
        if not description:
            return ""
        
        # Limpiar entidades HTML que puedan estar en la descripción
        description = description.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&')
        
        print(f"🖼️ Procesando marcador de imagen: '{description[:100]}...'")
        
        # Buscar imagen
        image_data = search_image(description)
        
        if image_data:
            image_url = image_data["url"]
            image_desc = image_data.get("description", description)
            print(f"✅ Imagen encontrada para '{description[:50]}...': {image_url[:80]}...")
            
            # Reemplazar con tag HTML de imagen
            # Escapar comillas en la descripción para evitar problemas con HTML
            safe_desc = image_desc.replace('"', '&quot;').replace("'", "&#39;")
            return f'\n<div style="margin: 2rem 0; text-align: center;"><img src="{image_url}" alt="{safe_desc}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /><p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280; font-style: italic;">{safe_desc}</p></div>\n'
        else:
            print(f"⚠️ No se encontró imagen para '{description[:50]}...', usando placeholder SVG")
            # Generar un placeholder SVG más apropiado para contenido educativo
            safe_desc = description.replace('"', '&quot;').replace("'", "&#39;")
            is_technical = _is_technical_diagram(description)
            
            if is_technical:
                # Para diagramas técnicos, usar un SVG placeholder que indique que es un diagrama
                import hashlib
                import base64
                hash_obj = hashlib.md5(description.encode())
                hash_int = int(hash_obj.hexdigest()[:8], 16)
                
                # Generar un SVG placeholder con un diseño que sugiera un diagrama técnico
                svg_placeholder = f'''<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
  <rect width="800" height="400" fill="rgba(255,255,255,0.1)" rx="8"/>
  <text x="400" y="180" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">📊 Diagrama Técnico</text>
  <text x="400" y="220" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">{safe_desc[:60]}{"..." if len(safe_desc) > 60 else ""}</text>
  <text x="400" y="260" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">Imagen no disponible - Diagrama educativo requerido</text>
  <!-- Elementos decorativos que sugieren un diagrama -->
  <circle cx="200" cy="320" r="30" fill="rgba(255,255,255,0.2)"/>
  <rect x="350" y="290" width="100" height="60" fill="rgba(255,255,255,0.2)" rx="4"/>
  <polygon points="550,320 600,290 650,320 600,350" fill="rgba(255,255,255,0.2)"/>
</svg>'''
                
                # Convertir SVG a data URI
                svg_encoded = base64.b64encode(svg_placeholder.encode('utf-8')).decode('utf-8')
                placeholder_url = f"data:image/svg+xml;base64,{svg_encoded}"
            else:
                # Para imágenes generales, usar Lorem Picsum pero con un mensaje más claro
                import hashlib
                hash_obj = hashlib.md5(description.encode())
                hash_int = int(hash_obj.hexdigest()[:8], 16)
                placeholder_url = f"https://picsum.photos/800/400?random={hash_int}"
            
            return f'\n<div style="margin: 2rem 0; text-align: center;"><img src="{placeholder_url}" alt="{safe_desc}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); opacity: 0.8;" /><p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280; font-style: italic;">🖼️ <strong>Imagen ilustrativa:</strong> {safe_desc}</p></div>\n'
    
    # ESTRATEGIA: Procesar cada marcador individualmente, sin importar dónde esté
    # Esto asegura que TODOS los marcadores se procesen, incluso si están en blockquotes con múltiples <p>
    
    def process_single_image_marker(match):
        """Procesa un solo marcador de imagen y retorna el HTML de la imagen"""
        description = match.group(1).strip().replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&')
        if not description:
            return ""
        
        print(f"🖼️ Procesando marcador de imagen: '{description[:100]}...'")
        
        image_data = search_image(description)
        safe_desc = description.replace('"', '&quot;').replace("'", "&#39;")
        
        if image_data:
            print(f"✅ Imagen encontrada para '{description[:50]}...': {image_data['url'][:80]}...")
            return f'\n<div style="margin: 2rem 0; text-align: center;"><img src="{image_data["url"]}" alt="{safe_desc}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /><p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280; font-style: italic;">{safe_desc}</p></div>\n'
        else:
            print(f"⚠️ No se encontró imagen para '{description[:50]}...', usando placeholder SVG")
            # Generar un placeholder SVG más apropiado para contenido educativo
            is_technical = _is_technical_diagram(description)
            
            if is_technical:
                # Para diagramas técnicos, usar un SVG placeholder que indique que es un diagrama
                import hashlib
                hash_obj = hashlib.md5(description.encode())
                hash_int = int(hash_obj.hexdigest()[:8], 16)
                
                # Generar un SVG placeholder con un diseño que sugiera un diagrama técnico
                svg_placeholder = f'''<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
  <rect width="800" height="400" fill="rgba(255,255,255,0.1)" rx="8"/>
  <text x="400" y="180" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">📊 Diagrama Técnico</text>
  <text x="400" y="220" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">{safe_desc[:60]}{"..." if len(safe_desc) > 60 else ""}</text>
  <text x="400" y="260" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">Imagen no disponible - Diagrama educativo requerido</text>
  <!-- Elementos decorativos que sugieren un diagrama -->
  <circle cx="200" cy="320" r="30" fill="rgba(255,255,255,0.2)"/>
  <rect x="350" y="290" width="100" height="60" fill="rgba(255,255,255,0.2)" rx="4"/>
  <polygon points="550,320 600,290 650,320 600,350" fill="rgba(255,255,255,0.2)"/>
</svg>'''
                
                # Convertir SVG a data URI
                import base64
                svg_encoded = base64.b64encode(svg_placeholder.encode('utf-8')).decode('utf-8')
                placeholder_url = f"data:image/svg+xml;base64,{svg_encoded}"
            else:
                # Para imágenes generales, usar Lorem Picsum pero con un mensaje más claro
                import hashlib
                hash_obj = hashlib.md5(description.encode())
                hash_int = int(hash_obj.hexdigest()[:8], 16)
                placeholder_url = f"https://picsum.photos/800/400?random={hash_int}"
            
            return f'\n<div style="margin: 2rem 0; text-align: center;"><img src="{placeholder_url}" alt="{safe_desc}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); opacity: 0.8;" /><p style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280; font-style: italic;">🖼️ <strong>Imagen ilustrativa:</strong> {safe_desc}</p></div>\n'
    
    # Patrón universal que busca el marcador en cualquier contexto
    # Busca 🖼️ [INSERTAR IMAGEN: ...] sin importar qué tags HTML lo rodeen
    universal_pattern = r'🖼️\s*\[INSERTAR IMAGEN:\s*([^\]]+?)\]'
    
    # Reemplazar todos los marcadores encontrados
    processed_content = re.sub(universal_pattern, process_single_image_marker, content, flags=re.IGNORECASE | re.DOTALL)
    
    # LIMPIEZA CRÍTICA: Eliminar bloques HTML que quedaron mal formados después de reemplazar marcadores
    # Esto es crucial porque el navegador puede no renderizar imágenes dentro de <p> o <blockquote> vacíos
    
    # 1. Eliminar <p> que solo contienen un <div> (la imagen)
    # Patrón: <p>...<div>imagen</div>...</p> -> <div>imagen</div>
    processed_content = re.sub(
        r'<p[^>]*>\s*(<div[^>]*>.*?</div>)\s*</p>',
        r'\1',
        processed_content,
        flags=re.IGNORECASE | re.DOTALL
    )
    
    # 2. Eliminar <blockquote> que solo contienen un <div> (la imagen)
    # Patrón: <blockquote>...<div>imagen</div>...</blockquote> -> <div>imagen</div>
    processed_content = re.sub(
        r'<blockquote[^>]*>\s*(<div[^>]*>.*?</div>)\s*</blockquote>',
        r'\1',
        processed_content,
        flags=re.IGNORECASE | re.DOTALL
    )
    
    # 3. Eliminar <p> vacíos
    processed_content = re.sub(r'<p[^>]*>\s*</p>', '', processed_content, flags=re.IGNORECASE)
    
    # 4. Eliminar <blockquote> vacíos
    processed_content = re.sub(r'<blockquote[^>]*>\s*</blockquote>', '', processed_content, flags=re.IGNORECASE | re.DOTALL)
    
    # 5. Eliminar <blockquote> que solo tienen espacios, saltos de línea o <p> vacíos
    processed_content = re.sub(r'<blockquote[^>]*>\s*(<p[^>]*>\s*</p>)*\s*</blockquote>', '', processed_content, flags=re.IGNORECASE | re.DOTALL)
    
    # 6. Limpiar múltiples saltos de línea consecutivos (más de 2)
    processed_content = re.sub(r'\n{3,}', '\n\n', processed_content)
    
    return processed_content


def extract_text_from_pdf(pdf_url: str) -> Optional[str]:
    """
    Extrae texto de un PDF desde una URL
    
    Args:
        pdf_url: URL del PDF
        
    Returns:
        Texto extraído del PDF o None si hay error
    """
    if not PDF_AVAILABLE:
        print(f"⚠️ PyPDF2 no está disponible. No se puede extraer texto de {pdf_url}")
        return None
    
    try:
        # Si es una URL local (localhost), intentar leer desde el sistema de archivos
        if "localhost" in pdf_url or "127.0.0.1" in pdf_url:
            # Extraer la ruta del archivo de la URL
            if "/api/files/" in pdf_url:
                file_path = pdf_url.split("/api/files/")[-1]
                # Buscar en el directorio de documentos
                documents_dir = Path("documents")
                pdf_path = documents_dir / file_path
                if pdf_path.exists():
                    with open(pdf_path, "rb") as f:
                        pdf_reader = PyPDF2.PdfReader(f)
                        text = ""
                        for page in pdf_reader.pages:
                            text += page.extract_text() + "\n"
                        return text
        else:
            # Descargar desde URL externa
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            pdf_file = io.BytesIO(response.content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"⚠️ Error extrayendo texto de PDF {pdf_url}: {e}")
        return None


def summarize_content_for_context(
    gemini_api_key: str,
    content_text: str,
    content_type: str,  # "teorico" o "examenes"
    model: str = "gemini-1.5-pro"
) -> Optional[str]:
    """
    Hace un resumen inteligente del contenido para usarlo como contexto
    
    Args:
        gemini_api_key: API key de Google Gemini
        content_text: Texto completo a resumir
        content_type: Tipo de contenido ("teorico" o "examenes")
        model: Modelo de Gemini a usar
        
    Returns:
        Texto resumido con conceptos clave o None si hay error
    """
    try:
        if content_type == "examenes":
            prompt = f"""Analiza los siguientes exámenes y extrae:

1. **Temas y conceptos que aparecen frecuentemente** (lista con frecuencia)
2. **Tipos de preguntas más comunes** (múltiple opción, desarrollo, etc.)
3. **Conceptos clave que siempre preguntan** (definiciones, fórmulas, procedimientos)
4. **Preguntas trampa o conceptos confusos** que aparecen repetidamente
5. **Patrones de preguntas** (ej: "Siempre preguntan la diferencia entre X e Y")

Mantén TODA la información relevante pero de forma estructurada y concisa. El objetivo es que esta información se use para priorizar contenido en apuntes.

EXÁMENES:
{content_text}

Extrae y estructura la información relevante:"""
        else:  # teorico
            prompt = f"""Analiza el siguiente material teórico y extrae:

1. **Conceptos principales y definiciones clave**
2. **Estructura temática** (qué temas se cubren y en qué orden)
3. **Fórmulas, procedimientos y algoritmos importantes**
4. **Ejemplos y casos de uso relevantes**
5. **Relaciones entre conceptos** (qué conceptos están relacionados)

Mantén TODA la información relevante pero de forma estructurada. El objetivo es preservar el contenido completo pero de forma más manejable.

MATERIAL TEÓRICO:
{content_text}

Extrae y estructura la información relevante:"""
        
        # Primero, intentar obtener modelos disponibles de la API
        available_models = []
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1/models?key={gemini_api_key}"
            list_response = requests.get(list_url, timeout=10)
            if list_response.status_code == 200:
                models_data = list_response.json()
                if "models" in models_data:
                    for m in models_data["models"]:
                        name = m.get("name", "").replace("models/", "")
                        if "gemini" in name.lower() and "generateContent" in m.get("supportedGenerationMethods", []):
                            available_models.append(name)
        except:
            pass
        
        # Si no se pudieron listar, usar modelos por defecto conocidos
        if not available_models:
            available_models = ["gemini-pro", "gemini-1.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"]
        
        # Mapear nombres antiguos a nombres correctos
        model_mapping = {
            "gemini-3-pro": "gemini-pro",
            "gemini-3-flash": "gemini-pro",
            "gemini-2.5-pro": "gemini-pro",
            "gemini-2.5-flash": "gemini-pro",
            "gemini-1.5-pro": "gemini-pro",
            "gemini-1.5-flash": "gemini-pro",
            "gemini-1.5-flash-8b": "gemini-pro",
            "gemini-pro": "gemini-pro",
        }
        
        # Intentar usar el modelo solicitado o su mapeo
        preferred_model = model_mapping.get(model, model)
        
        # Si el modelo preferido no está disponible, usar el primero disponible
        if preferred_model not in available_models and available_models:
            preferred_model = available_models[0]
            print(f"⚠️ Modelo {model} no disponible, usando {preferred_model}")
        
        # Usar directamente v1 (ya no está en beta)
        url = f"https://generativelanguage.googleapis.com/v1/models/{preferred_model}:generateContent?key={gemini_api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.3,  # Más bajo para resúmenes más precisos
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 16384,  # Más tokens para resúmenes completos
            }
        }
        
        response = requests.post(url, json=payload, timeout=180)
        
        # Si falla, intentar con otros modelos disponibles
        if response.status_code == 404 and available_models:
            for fallback_model in available_models:
                if fallback_model != preferred_model:
                    print(f"⚠️ Modelo {preferred_model} no encontrado, intentando {fallback_model}...")
                    url_fallback = f"https://generativelanguage.googleapis.com/v1/models/{fallback_model}:generateContent?key={gemini_api_key}"
                    response = requests.post(url_fallback, json=payload, timeout=180)
                    if response.status_code == 200:
                        break
        
        # Si aún falla, verificar el error real
        if response.status_code != 200:
            try:
                error_detail = response.json()
                error_message = error_detail.get("error", {}).get("message", str(error_detail))
            except:
                error_message = response.text[:500]
            
            print(f"❌ Error de API de Gemini (status {response.status_code}): {error_message}")
            print(f"⚠️ URL intentada: {url_fallback if 'url_fallback' in locals() else url}")
            print(f"⚠️ API Key configurada: {'Sí' if gemini_api_key else 'No'} (primeros 10 chars: {gemini_api_key[:10] if gemini_api_key else 'N/A'}...)")
            
            # Si es 401 o 403, el problema es la API key
            if response.status_code in [401, 403]:
                raise Exception(f"API key de Gemini inválida o sin permisos. Obtén una nueva en https://aistudio.google.com/app/apikey. Error: {error_message}")
            # Si es 404, puede ser modelo o URL incorrecta
            elif response.status_code == 404:
                raise Exception(f"No se pudo conectar con la API de Gemini. Verifica:\n1. Que tu API key sea válida (obtén una en https://aistudio.google.com/app/apikey)\n2. Que tengas acceso a la API de Gemini\n3. Que la API key tenga los permisos necesarios\nError: {error_message}")
        
        response.raise_for_status()
        
        result = response.json()
        
        if "candidates" in result and len(result["candidates"]) > 0:
            content = result["candidates"][0].get("content", {})
            parts = content.get("parts", [])
            if parts and "text" in parts[0]:
                summarized_text = parts[0]["text"]
                
                # Limpiar HTML: eliminar bloques ```html si existen
                if summarized_text.strip().startswith('```html') or summarized_text.strip().startswith('``` html'):
                    match = re.search(r'```\s*html\s*\n(.*?)\n```\s*$', summarized_text, flags=re.DOTALL | re.IGNORECASE)
                    if match:
                        summarized_text = match.group(1)
                        print(f"🧹 Extraído contenido HTML del bloque ```html")
                    else:
                        summarized_text = re.sub(r'^```\s*html\s*\n', '', summarized_text, flags=re.MULTILINE | re.IGNORECASE)
                        summarized_text = summarized_text.strip()
                
                # Detectar si es Markdown o HTML ANTES de procesar imágenes
                # Verificar si tiene elementos HTML válidos
                has_html_tags = bool(re.search(r'<[a-z][a-z0-9]*[^>]*>', summarized_text[:500], re.IGNORECASE))
                has_markdown = bool(re.search(r'\*\*[^*]+\*\*|^#+\s+', summarized_text[:500], re.MULTILINE))
                
                # Si tiene Markdown pero no HTML válido, convertir PRIMERO
                if has_markdown and not has_html_tags:
                    print(f"📝 Detectado Markdown, convirtiendo a HTML...")
                    print(f"   Primeros 200 chars: {summarized_text[:200]}")
                    summarized_text = _markdown_to_html(summarized_text)
                    print(f"✅ Markdown convertido a HTML ({len(summarized_text)} chars)")
                elif has_html_tags:
                    print(f"✅ Contenido ya es HTML ({len(summarized_text)} chars)")
                else:
                    print(f"ℹ️ Contenido sin formato detectado, procesando como texto plano")
                
                # Procesar marcadores de imagen DESPUÉS de convertir Markdown a HTML
                # Esto asegura que las imágenes se inserten en HTML válido
                summarized_text = _process_image_markers(summarized_text)
                
                # Verificación final: asegurar que el contenido final sea HTML válido
                # Si después de todo el procesamiento aún tiene Markdown, forzar conversión
                if re.search(r'\*\*[^*]+\*\*|^#+\s+', summarized_text[:1000], re.MULTILINE):
                    print(f"⚠️ Aún queda Markdown después del procesamiento, forzando conversión final...")
                    summarized_text = _markdown_to_html(summarized_text)
                    print(f"✅ Conversión final completada ({len(summarized_text)} chars)")
                
                usage_metadata = result.get("usageMetadata", {})
                print(f"✅ Resumen de {content_type} generado:")
                print(f"   - Tokens entrada: {usage_metadata.get('promptTokenCount', 0):,}")
                print(f"   - Tokens salida: {usage_metadata.get('candidatesTokenCount', 0):,}")
                
                return summarized_text
        
        return None
        
    except Exception as e:
        print(f"❌ Error generando resumen de {content_type}: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_summary_with_gemini(
    gemini_api_key: str,
    topic_name: str,
    pdf_urls: List[str],
    course_title: str,
    course_description: str,
    additional_comments: Optional[str] = None,
    is_subtopic: bool = False,
    model: str = "gemini-1.5-pro",  # Modelo por defecto: Gemini 1.5 Pro (mejor calidad)
    exam_examples_pdfs: Optional[List[str]] = None  # PDFs de exámenes para priorizar contenido
) -> Optional[str]:
    """
    Genera un resumen/apunte usando Gemini API con el prompt de academia
    
    Args:
        gemini_api_key: API key de Google Gemini
        topic_name: Nombre del tema/apartado
        pdf_urls: Lista de URLs de PDFs del material teórico
        course_title: Título del curso
        course_description: Descripción del curso
        additional_comments: Comentarios adicionales del usuario
        is_subtopic: Si es True, es un subapartado
        model: Modelo de Gemini a usar
        exam_examples_pdfs: Lista de URLs de PDFs de exámenes para priorizar contenido
        
    Returns:
        Texto del resumen generado o None si hay error
    """
    try:
        # Extraer texto de TODOS los PDFs del material teórico (sin límites)
        print(f"📖 Extrayendo texto completo de {len(pdf_urls)} PDF(s) teóricos...")
        pdf_texts = []
        for pdf_url in pdf_urls:
            text = extract_text_from_pdf(pdf_url)
            if text:
                pdf_texts.append(text)
                print(f"   ✅ PDF extraído: {pdf_url} ({len(text):,} caracteres)")
        
        if not pdf_texts:
            print(f"⚠️ No se pudo extraer texto de los PDFs para {topic_name}")
            return None
        
        # Combinar TODOS los textos del material teórico (sin truncar)
        material_teorico_completo = "\n\n---\n\n".join(pdf_texts)
        print(f"📚 Material teórico completo: {len(material_teorico_completo):,} caracteres")
        
        # Extraer texto de TODOS los PDFs de exámenes (sin límites)
        material_examenes_completo = None
        if exam_examples_pdfs:
            print(f"📝 Extrayendo texto completo de {len(exam_examples_pdfs)} PDF(s) de exámenes...")
            exam_texts = []
            for exam_pdf_url in exam_examples_pdfs:
                exam_text = extract_text_from_pdf(exam_pdf_url)
                if exam_text:
                    exam_texts.append(exam_text)
                    print(f"   ✅ Examen extraído: {exam_pdf_url} ({len(exam_text):,} caracteres)")
            
            if exam_texts:
                material_examenes_completo = "\n\n--- EXAMEN ---\n\n".join(exam_texts)
                print(f"📋 Material de exámenes completo: {len(material_examenes_completo):,} caracteres")
        
        # Hacer resumen inteligente del material teórico para preservar todo el contenido
        print(f"\n🔄 Generando resumen inteligente del material teórico...")
        material_teorico = summarize_content_for_context(
            gemini_api_key=gemini_api_key,
            content_text=material_teorico_completo,
            content_type="teorico",
            model=model
        )
        
        if not material_teorico:
            print(f"⚠️ No se pudo generar resumen del material teórico, usando texto completo (puede ser truncado)")
            # Fallback: usar texto completo pero truncado si es muy largo
            max_chars = 500000
            if len(material_teorico_completo) > max_chars:
                material_teorico = material_teorico_completo[:max_chars] + "\n\n[... texto truncado por límite ...]"
            else:
                material_teorico = material_teorico_completo
        
        # Hacer resumen inteligente de los exámenes si existen
        material_examenes = None
        if material_examenes_completo:
            print(f"\n🔄 Generando resumen inteligente de los exámenes...")
            material_examenes = summarize_content_for_context(
                gemini_api_key=gemini_api_key,
                content_text=material_examenes_completo,
                content_type="examenes",
                model=model
            )
            
            if not material_examenes:
                print(f"⚠️ No se pudo generar resumen de exámenes, usando texto completo (puede ser truncado)")
                # Fallback: usar texto completo pero truncado si es muy largo
                max_chars = 300000
                if len(material_examenes_completo) > max_chars:
                    material_examenes = material_examenes_completo[:max_chars] + "\n\n[... exámenes truncados ...]"
                else:
                    material_examenes = material_examenes_completo
        
        # Construir el prompt usando el formato de academia
        topic_type = "subapartado" if is_subtopic else "apartado"
        
        prompt = f"""# ROL

Eres un Profesor Experto de una academia de alto rendimiento especializada en preparar estudiantes para exámenes universitarios y oposiciones. Tu objetivo es transformar material teórico denso en "Apuntes de Academia" de alta calidad, optimizados para estudiar y aprobar.

# TAREA

Generar unos apuntes de estudio estructurados basándote en el MATERIAL TEÓRICO proporcionado, pero filtrando y priorizando el contenido según el MATERIAL DE EXÁMENES (si se proporciona).

# INPUTS

1. [MATERIAL TEÓRICO]: El texto completo de los PDFs de teoría del {topic_type} "{topic_name}" del curso "{course_title}".

2. [MATERIAL DE EXÁMENES]: El texto de exámenes de años anteriores (si se proporciona).

# CONTEXTO DEL CURSO

Título del curso: {course_title}
Descripción: {course_description}

"""
        
        if additional_comments:
            prompt += f"""# INSTRUCCIONES ADICIONALES DEL PROFESOR

{additional_comments}

"""
        
        prompt += f"""# MATERIAL TEÓRICO

{material_teorico}

"""
        
        if material_examenes:
            prompt += f"""# MATERIAL DE EXÁMENES

{material_examenes}

"""
        
        prompt += """# DIRECTRICES DE ESTILO (CRÍTICO)

Tu salida debe imitar el estilo de los mejores apuntes de academia (estilo "AC" o "IDI"):

1. **Jerarquía Visual:** Usa estrictamente Markdown (`#`, `##`, `###`) para estructurar.

2. **Sintético y Directo:** No uses párrafos largos. Usa listas (`*`) y frases cortas. Ve al grano.

3. **Enfoque en Examen:**

   - Si un concepto aparece en los [EXÁMENES], márcalo como **IMPORTANTE** o pon un icono 🎯. Explícalo con mayor profundidad.

   - Si algo es pura "paja" o introducción irrelevante, ignóralo o resúmelo en una línea.

4. **Visualización:**

   - **Tablas:** SIEMPRE que haya una comparación (ej: Tipos de RAID, Versiones de Software, Pros/Contras), crea una tabla Markdown.

   - **Fórmulas:** Usa LaTeX para cualquier expresión matemática (ej: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$).

   - **Código:** Si hay pseudocódigo o programación, usa bloques de código con su lenguaje correspondiente (ej: ```cpp).

5. **Diagramas:** Como eres una IA de texto, no puedes generar la imagen, pero DEBES indicar dónde va una imagen con una descripción detallada para que el creador la inserte. Usa este formato: `> 🖼️ [INSERTAR IMAGEN: Descripción detallada del diagrama necesario aquí]`.

# ESTRUCTURA DE LOS APUNTES

Sigue este formato para la salida:

## [Título del Tema]

### 🎯 Conceptos Clave (Resumen Ejecutivo)

* Lista rápida de lo que se va a aprender.

### 1. [Subtema Principal]

Explicación clara y concisa.

* **Definición:** ...

* **Características:**

  * Punto A

  * Punto B

> 🖼️ [INSERTAR IMAGEN: Esquema visual de [Subtema]]

### 2. [Subtema Comparativo]

(Si aplica, usa tablas aquí)

| Característica | Tipo A | Tipo B |
| :--- | :--- | :--- |
| Velocidad | Alta | Baja |
| Coste | $$$ | $ |

### 3. Fórmulas y Procedimientos

Si hay matemáticas o algoritmos:

$$F = m \\cdot a$$

### ⚠️ OJO AL EXAMEN (Sección Crucial)

* Aquí recopila las preguntas trampa o conceptos que se repiten mucho en los [EXÁMENES] proporcionados.

* Da consejos tipo "Suelen preguntar la diferencia entre X e Y".

---

# INSTRUCCIONES PASO A PASO

1. Analiza los [EXÁMENES] para identificar palabras clave y temas recurrentes (mapa de calor).

2. Lee el [MATERIAL TEÓRICO].

3. Genera los apuntes. Si el texto original es confuso, reescríbelo para que sea didáctico.

4. Asegúrate de incluir los marcadores de imágenes `> 🖼️`.

¡Comienza la generación ahora!"""
        
        # Primero, intentar obtener modelos disponibles de la API
        available_models = []
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1/models?key={gemini_api_key}"
            list_response = requests.get(list_url, timeout=10)
            if list_response.status_code == 200:
                models_data = list_response.json()
                if "models" in models_data:
                    for m in models_data["models"]:
                        name = m.get("name", "").replace("models/", "")
                        if "gemini" in name.lower() and "generateContent" in m.get("supportedGenerationMethods", []):
                            available_models.append(name)
        except:
            pass
        
        # Si no se pudieron listar, usar modelos por defecto conocidos
        if not available_models:
            available_models = ["gemini-pro", "gemini-1.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"]
        
        # Mapear nombres antiguos a nombres correctos
        model_mapping = {
            "gemini-3-pro": "gemini-pro",
            "gemini-3-flash": "gemini-pro",
            "gemini-2.5-pro": "gemini-pro",
            "gemini-2.5-flash": "gemini-pro",
            "gemini-1.5-pro": "gemini-pro",
            "gemini-1.5-flash": "gemini-pro",
            "gemini-1.5-flash-8b": "gemini-pro",
            "gemini-pro": "gemini-pro",
        }
        
        # Intentar usar el modelo solicitado o su mapeo
        preferred_model = model_mapping.get(model, model)
        
        # Si el modelo preferido no está disponible, usar el primero disponible
        if preferred_model not in available_models and available_models:
            preferred_model = available_models[0]
            print(f"⚠️ Modelo {model} no disponible, usando {preferred_model}")
        
        # Usar directamente v1 (ya no está en beta)
        url = f"https://generativelanguage.googleapis.com/v1/models/{preferred_model}:generateContent?key={gemini_api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 8192,  # Máximo de tokens de salida
            }
        }
        
        response = requests.post(url, json=payload, timeout=120)
        
        # Si falla, intentar con otros modelos disponibles
        if response.status_code == 404 and available_models:
            for fallback_model in available_models:
                if fallback_model != preferred_model:
                    print(f"⚠️ Modelo {preferred_model} no encontrado, intentando {fallback_model}...")
                    url_fallback = f"https://generativelanguage.googleapis.com/v1/models/{fallback_model}:generateContent?key={gemini_api_key}"
                    response = requests.post(url_fallback, json=payload, timeout=120)
                    if response.status_code == 200:
                        break
        
        # Si aún falla, verificar el error real
        if response.status_code != 200:
            try:
                error_detail = response.json()
                error_message = error_detail.get("error", {}).get("message", str(error_detail))
            except:
                error_message = response.text[:500]
            
            print(f"❌ Error de API de Gemini (status {response.status_code}): {error_message}")
            print(f"⚠️ URL intentada: {url_fallback if 'url_fallback' in locals() else url}")
            print(f"⚠️ API Key configurada: {'Sí' if gemini_api_key else 'No'} (primeros 10 chars: {gemini_api_key[:10] if gemini_api_key else 'N/A'}...)")
            
            # Si es 401 o 403, el problema es la API key
            if response.status_code in [401, 403]:
                raise Exception(f"API key de Gemini inválida o sin permisos. Obtén una nueva en https://aistudio.google.com/app/apikey. Error: {error_message}")
            # Si es 404, puede ser modelo o URL incorrecta
            elif response.status_code == 404:
                raise Exception(f"No se pudo conectar con la API de Gemini. Verifica:\n1. Que tu API key sea válida (obtén una en https://aistudio.google.com/app/apikey)\n2. Que tengas acceso a la API de Gemini\n3. Que la API key tenga los permisos necesarios\nError: {error_message}")
        
        response.raise_for_status()
        
        result = response.json()
        
        # Extraer el texto generado
        if "candidates" in result and len(result["candidates"]) > 0:
            content = result["candidates"][0].get("content", {})
            parts = content.get("parts", [])
            if parts and "text" in parts[0]:
                generated_text = parts[0]["text"]
                
                # Limpiar HTML: eliminar bloques ```html si existen
                if generated_text.strip().startswith('```html') or generated_text.strip().startswith('``` html'):
                    match = re.search(r'```\s*html\s*\n(.*?)\n```\s*$', generated_text, flags=re.DOTALL | re.IGNORECASE)
                    if match:
                        generated_text = match.group(1)
                        print(f"🧹 Extraído contenido HTML del bloque ```html")
                    else:
                        generated_text = re.sub(r'^```\s*html\s*\n', '', generated_text, flags=re.MULTILINE | re.IGNORECASE)
                        generated_text = generated_text.strip()
                
                # Detectar si es Markdown o HTML ANTES de procesar imágenes
                # Verificar si tiene elementos HTML válidos
                has_html_tags = bool(re.search(r'<[a-z][a-z0-9]*[^>]*>', generated_text[:500], re.IGNORECASE))
                has_markdown = bool(re.search(r'\*\*[^*]+\*\*|^#+\s+', generated_text[:500], re.MULTILINE))
                
                # Si tiene Markdown pero no HTML válido, convertir PRIMERO
                if has_markdown and not has_html_tags:
                    print(f"📝 Detectado Markdown, convirtiendo a HTML...")
                    print(f"   Primeros 200 chars: {generated_text[:200]}")
                    generated_text = _markdown_to_html(generated_text)
                    print(f"✅ Markdown convertido a HTML ({len(generated_text)} chars)")
                elif has_html_tags:
                    print(f"✅ Contenido ya es HTML ({len(generated_text)} chars)")
                else:
                    print(f"ℹ️ Contenido sin formato detectado, procesando como texto plano")
                
                # Procesar marcadores de imagen DESPUÉS de convertir Markdown a HTML
                # Esto asegura que las imágenes se inserten en HTML válido
                generated_text = _process_image_markers(generated_text)
                
                # Verificación final: asegurar que el contenido final sea HTML válido
                # Si después de todo el procesamiento aún tiene Markdown, forzar conversión
                if re.search(r'\*\*[^*]+\*\*|^#+\s+', generated_text[:1000], re.MULTILINE):
                    print(f"⚠️ Aún queda Markdown después del procesamiento, forzando conversión final...")
                    generated_text = _markdown_to_html(generated_text)
                    print(f"✅ Conversión final completada ({len(generated_text)} chars)")
                
                # Obtener estadísticas de uso
                usage_metadata = result.get("usageMetadata", {})
                prompt_tokens = usage_metadata.get("promptTokenCount", 0)
                candidates_tokens = usage_metadata.get("candidatesTokenCount", 0)
                total_tokens = usage_metadata.get("totalTokenCount", 0)
                
                print(f"✅ Resumen generado para {topic_name}:")
                print(f"   - Tokens de entrada: {prompt_tokens:,}")
                print(f"   - Tokens de salida: {candidates_tokens:,}")
                print(f"   - Total: {total_tokens:,}")
                
                return generated_text
        
        print(f"⚠️ No se pudo extraer texto de la respuesta de Gemini para {topic_name}")
        return None
        
    except Exception as e:
        print(f"❌ Error generando resumen con Gemini para {topic_name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def estimate_gemini_cost(
    num_topics: int, 
    num_subtopics: int, 
    avg_pdf_pages: int = 20,
    model: str = "gemini-1.5-pro"
) -> Dict[str, float]:
    """
    Estima el costo de generar resúmenes con Gemini
    
    Args:
        num_topics: Número de apartados principales
        num_subtopics: Número de subapartados
        avg_pdf_pages: Promedio de páginas por PDF
        model: Modelo de Gemini a usar
        
    Returns:
        Diccionario con estimación de costos
    """
    # Precios de Gemini (en USD por millón de tokens)
    # NOTA: Estos precios son aproximados y deben actualizarse con los precios oficiales
    # cuando estén disponibles públicamente
    
    # Mapear nombres antiguos a nombres correctos para precios
    model_mapping = {
        "gemini-3-pro": "gemini-1.5-pro",
        "gemini-3-flash": "gemini-1.5-flash",
        "gemini-2.5-pro": "gemini-1.5-pro",
        "gemini-2.5-flash": "gemini-1.5-flash",
        "gemini-2.5-flash-lite": "gemini-1.5-flash-8b"
    }
    actual_model = model_mapping.get(model, model)
    
    pricing = {
        "gemini-1.5-pro": {
            "input": 1.25,   # Precio oficial aproximado
            "output": 5.00
        },
        "gemini-1.5-flash": {
            "input": 0.075,   # Precio oficial aproximado
            "output": 0.30
        },
        "gemini-1.5-flash-8b": {
            "input": 0.0375,
            "output": 0.15
        }
    }
    
    # Obtener precios del modelo seleccionado
    model_pricing = pricing.get(actual_model, pricing["gemini-1.5-pro"])
    input_price = model_pricing["input"]
    output_price = model_pricing["output"]
    
    # Estimación: ~750 tokens por página de PDF (input)
    # Estimación: ~2000 tokens por resumen generado (output)
    
    total_items = num_topics + num_subtopics
    
    # Si no hay items, el costo es 0
    if total_items == 0:
        total_cost_eur = 0.0
        total_cost_usd = 0.0
        total_input_tokens = 0
        total_output_tokens = 0
    else:
        tokens_per_pdf = avg_pdf_pages * 750
        tokens_input_per_item = tokens_per_pdf + 500  # +500 para el prompt base
        tokens_output_per_item = 2000
        
        total_input_tokens = total_items * tokens_input_per_item
        total_output_tokens = total_items * tokens_output_per_item
        
        cost_input = (total_input_tokens / 1_000_000) * input_price
        cost_output = (total_output_tokens / 1_000_000) * output_price
        total_cost_usd = cost_input + cost_output
        
        # Convertir a EUR (aproximadamente 1 USD = 0.92 EUR)
        total_cost_eur = total_cost_usd * 0.92
    
    return {
        "model": model,
        "total_items": total_items,
        "estimated_input_tokens": total_input_tokens,
        "estimated_output_tokens": total_output_tokens,
        "estimated_cost_usd": total_cost_usd,
        "estimated_cost_eur": total_cost_eur,
        "pricing_per_million": {
            "input_usd": input_price,
            "output_usd": output_price
        },
        "breakdown": {
            "input_cost_usd": cost_input,
            "output_cost_usd": cost_output,
            "input_cost_eur": cost_input * 0.92,
            "output_cost_eur": cost_output * 0.92
        },
        "note": "⚠️ Los precios son estimados. Verificar precios oficiales en Google AI Studio."
    }


def update_progress(course_id: str, current: int, total: int, current_item: str, status: str = "processing"):
    """Actualiza el progreso de generación de resúmenes"""
    with _progress_lock:
        _progress_tracker[course_id] = {
            "current": current,
            "total": total,
            "percentage": int((current / total * 100)) if total > 0 else 0,
            "current_item": current_item,
            "status": status,
            "completed": current >= total
        }

def get_progress(course_id: str) -> Optional[Dict]:
    """Obtiene el progreso actual de generación"""
    with _progress_lock:
        return _progress_tracker.get(course_id)

def clear_progress(course_id: str):
    """Limpia el progreso de un curso"""
    with _progress_lock:
        if course_id in _progress_tracker:
            del _progress_tracker[course_id]

def generate_all_course_summaries(
    gemini_api_key: str,
    course_id: str,
    course_title: str,
    course_description: str,
    topics: List[Dict],
    additional_comments: Optional[str] = None,
    model: str = "gemini-1.5-pro",  # Modelo por defecto: Gemini 1.5 Pro
    exam_examples_pdfs: Optional[List[str]] = None  # PDFs de exámenes para priorizar contenido
) -> Dict[str, Dict]:
    """
    Genera resúmenes para todos los apartados y subapartados de un curso
    
    Args:
        gemini_api_key: API key de Google Gemini
        course_id: ID del curso
        course_title: Título del curso
        course_description: Descripción del curso
        topics: Lista de temas con sus PDFs y subtopics
        additional_comments: Comentarios adicionales del usuario
        
    Returns:
        Diccionario con los resúmenes generados:
        {
            "topic_name": {
                "summary": "texto del resumen",
                "subtopics": {
                    "subtopic_name": "texto del resumen"
                }
            }
        }
    """
    summaries = {}
    
    print(f"\n📚 Iniciando generación de resúmenes para curso: {course_title}")
    print(f"   Total de apartados: {len(topics)}")
    
    total_subtopics = sum(len(topic.get("subtopics", [])) for topic in topics)
    print(f"   Total de subapartados: {total_subtopics}")
    
    # Calcular estimación de costos
    cost_estimate = estimate_gemini_cost(len(topics), total_subtopics, model=model)
    print(f"\n💰 Estimación de costos (modelo: {model}):")
    print(f"   - Total de items: {cost_estimate['total_items']}")
    print(f"   - Costo estimado: {cost_estimate['estimated_cost_eur']:.2f}€ ({cost_estimate['estimated_cost_usd']:.2f} USD)")
    if cost_estimate.get('note'):
        print(f"   - {cost_estimate['note']}")
    
    # Calcular total de items a procesar (apartados + subapartados)
    total_items = 0
    for topic in topics:
        if topic.get("pdfs"):
            total_items += 1  # Apartado principal
        total_items += len([st for st in topic.get("subtopics", []) if st.get("pdfs")])
    
    current_item = 0
    
    # Inicializar progreso
    update_progress(course_id, 0, total_items, "Iniciando...", "processing")
    
    # Generar resúmenes para cada apartado
    for topic in topics:
        topic_name = topic.get("name", "")
        pdfs = topic.get("pdfs", [])
        subtopics = topic.get("subtopics", [])
        
        print(f"\n📖 Generando resumen para apartado: {topic_name}")
        
        # Generar resumen del apartado principal (si tiene PDFs)
        topic_summary = None
        if pdfs:
            current_item += 1
            update_progress(course_id, current_item, total_items, f"Apartado: {topic_name}", "processing")
            topic_summary = generate_summary_with_gemini(
                gemini_api_key=gemini_api_key,
                topic_name=topic_name,
                pdf_urls=pdfs,
                course_title=course_title,
                course_description=course_description,
                additional_comments=additional_comments,
                is_subtopic=False,
                model=model,
                exam_examples_pdfs=exam_examples_pdfs
            )
        
        # Generar resúmenes para subapartados
        subtopic_summaries = {}
        for subtopic in subtopics:
            subtopic_name = subtopic.get("name", "")
            subtopic_pdfs = subtopic.get("pdfs", [])
            
            if subtopic_pdfs:
                current_item += 1
                update_progress(course_id, current_item, total_items, f"Subapartado: {subtopic_name}", "processing")
                print(f"   📝 Generando resumen para subapartado: {subtopic_name}")
                subtopic_summary = generate_summary_with_gemini(
                    gemini_api_key=gemini_api_key,
                    topic_name=subtopic_name,
                    pdf_urls=subtopic_pdfs,
                    course_title=course_title,
                    course_description=course_description,
                    additional_comments=additional_comments,
                    is_subtopic=True,
                    model=model,
                    exam_examples_pdfs=exam_examples_pdfs
                )
                if subtopic_summary:
                    subtopic_summaries[subtopic_name] = subtopic_summary
        
        # Guardar resúmenes del apartado
        summaries[topic_name] = {
            "summary": topic_summary,
            "subtopics": subtopic_summaries
        }
    
    # Marcar como completado
    update_progress(course_id, total_items, total_items, "Completado", "completed")
    
    print(f"\n✅ Generación de resúmenes completada para {len(summaries)} apartados")
    
    return summaries

