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
    model: str = "gemini-3-pro"
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
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}"
        
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
        response.raise_for_status()
        
        result = response.json()
        
        if "candidates" in result and len(result["candidates"]) > 0:
            content = result["candidates"][0].get("content", {})
            parts = content.get("parts", [])
            if parts and "text" in parts[0]:
                summarized_text = parts[0]["text"]
                
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
    model: str = "gemini-3-pro",  # Modelo por defecto: Gemini 3 Pro (mejor calidad)
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
        
        # Llamar a la API de Gemini
        # Modelos disponibles:
        # - gemini-3-pro: Mejor calidad para apuntes detallados
        # - gemini-3-flash: Más rápido y económico
        # - gemini-2.5-pro: Versión anterior, buena calidad
        # - gemini-2.5-flash: Versión anterior, más económica
        # - gemini-2.5-flash-lite: Versión más ligera
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}"
        
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
        response.raise_for_status()
        
        result = response.json()
        
        # Extraer el texto generado
        if "candidates" in result and len(result["candidates"]) > 0:
            content = result["candidates"][0].get("content", {})
            parts = content.get("parts", [])
            if parts and "text" in parts[0]:
                generated_text = parts[0]["text"]
                
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
    model: str = "gemini-3-pro"
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
    
    pricing = {
        "gemini-3-pro": {
            "input": 2.50,   # Estimado - VERIFICAR precio oficial
            "output": 10.00  # Estimado - VERIFICAR precio oficial
        },
        "gemini-3-flash": {
            "input": 0.10,   # Estimado - VERIFICAR precio oficial
            "output": 0.40   # Estimado - VERIFICAR precio oficial
        },
        "gemini-2.5-pro": {
            "input": 1.25,   # Estimado basado en versiones anteriores
            "output": 5.00
        },
        "gemini-2.5-flash": {
            "input": 0.075,
            "output": 0.30
        },
        "gemini-2.5-flash-lite": {
            "input": 0.0375,
            "output": 0.15
        }
    }
    
    # Obtener precios del modelo seleccionado
    model_pricing = pricing.get(model, pricing["gemini-3-pro"])
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
    model: str = "gemini-3-pro",  # Modelo por defecto: Gemini 3 Pro
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

