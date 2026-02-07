"""
Sistema de caché de resúmenes por nivel
Almacena resúmenes en diferentes niveles de detalle para reutilización
"""

import json
import os
from typing import Dict, Optional, List
from pathlib import Path
from datetime import datetime


# Directorio para almacenar caché de resúmenes
CACHE_DIR = Path("study_agents") / "summary_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_cache_file_path(course_id: str, topic: str) -> Path:
    """Obtiene la ruta del archivo de caché para un tema"""
    course_dir = CACHE_DIR / course_id
    course_dir.mkdir(parents=True, exist_ok=True)
    # Sanitizar nombre del tema para usar como nombre de archivo
    safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_topic = safe_topic.replace(' ', '_')[:50]  # Limitar longitud
    return course_dir / f"{safe_topic}.json"


def save_summary_cache(
    course_id: str,
    topic: str,
    level_1: Optional[str] = None,  # Resumen detallado (80% contenido)
    level_2: Optional[str] = None,  # Resumen medio (50% contenido)
    level_3: Optional[str] = None,  # Resumen breve (20% contenido)
    exam_priorities: Optional[str] = None,  # Prioridades de exámenes
    metadata: Optional[Dict] = None
) -> Dict:
    """
    Guarda resúmenes en caché para un tema
    
    Args:
        course_id: ID del curso
        topic: Nombre del tema
        level_1: Resumen detallado
        level_2: Resumen medio
        level_3: Resumen breve
        exam_priorities: Prioridades extraídas de exámenes
        metadata: Metadatos adicionales (fecha, modelo usado, etc.)
        
    Returns:
        Datos guardados en caché
    """
    cache_file = get_cache_file_path(course_id, topic)
    
    cache_data = {
        "course_id": course_id,
        "topic": topic,
        "summaries": {
            "level_1": level_1,
            "level_2": level_2,
            "level_3": level_3,
            "exam_priorities": exam_priorities
        },
        "metadata": {
            **(metadata or {}),
            "last_updated": datetime.now().isoformat(),
            "has_level_1": level_1 is not None,
            "has_level_2": level_2 is not None,
            "has_level_3": level_3 is not None,
            "has_exam_priorities": exam_priorities is not None
        }
    }
    
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Resumen guardado en caché: {cache_file}")
    return cache_data


def get_summary_cache(
    course_id: str,
    topic: str,
    level: Optional[int] = None
) -> Optional[Dict]:
    """
    Obtiene resumen del caché
    
    Args:
        course_id: ID del curso
        topic: Nombre del tema
        level: Nivel de resumen a obtener (1, 2, 3) o None para todos
        
    Returns:
        Dict con resúmenes o None si no existe
    """
    cache_file = get_cache_file_path(course_id, topic)
    
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            cache_data = json.load(f)
        
        if level:
            # Retornar solo el nivel solicitado
            level_key = f"level_{level}"
            if level_key in cache_data.get("summaries", {}):
                summary = cache_data["summaries"][level_key]
                if summary:
                    return {
                        "summary": summary,
                        "level": level,
                        "metadata": cache_data.get("metadata", {})
                    }
            return None
        
        return cache_data
    except Exception as e:
        print(f"⚠️ Error leyendo caché: {e}")
        return None


def get_cached_summary_for_context(
    course_id: str,
    topic: str,
    conversation_length: int = 0,
    prefer_level: Optional[int] = None
) -> Optional[str]:
    """
    Obtiene el resumen más apropiado según el contexto
    
    Args:
        course_id: ID del curso
        topic: Nombre del tema
        conversation_length: Longitud de la conversación actual
        prefer_level: Nivel preferido (1, 2, 3) o None para auto-seleccionar
        
    Returns:
        Resumen como string o None si no hay caché
    """
    cache_data = get_summary_cache(course_id, topic)
    
    if not cache_data:
        return None
    
    summaries = cache_data.get("summaries", {})
    
    # Si hay nivel preferido, usarlo
    if prefer_level and f"level_{prefer_level}" in summaries:
        summary = summaries[f"level_{prefer_level}"]
        if summary:
            return summary
    
    # Auto-seleccionar nivel según longitud de conversación
    if conversation_length < 5:
        # Conversación corta: usar nivel 3 (breve)
        return summaries.get("level_3")
    elif conversation_length < 20:
        # Conversación media: usar nivel 2 (medio)
        return summaries.get("level_2") or summaries.get("level_3")
    else:
        # Conversación larga: usar nivel 1 (detallado)
        return summaries.get("level_1") or summaries.get("level_2") or summaries.get("level_3")


def has_summary_cache(course_id: str, topic: str, level: Optional[int] = None) -> bool:
    """Verifica si existe caché para un tema"""
    cache_data = get_summary_cache(course_id, topic, level)
    return cache_data is not None


def clear_summary_cache(course_id: str, topic: Optional[str] = None):
    """
    Limpia el caché de resúmenes
    
    Args:
        course_id: ID del curso
        topic: Nombre del tema (opcional, si no se especifica limpia todo el curso)
    """
    if topic:
        cache_file = get_cache_file_path(course_id, topic)
        if cache_file.exists():
            cache_file.unlink()
            print(f"🗑️ Caché eliminado: {cache_file}")
    else:
        # Limpiar todo el curso
        course_dir = CACHE_DIR / course_id
        if course_dir.exists():
            for cache_file in course_dir.glob("*.json"):
                cache_file.unlink()
            print(f"🗑️ Caché del curso {course_id} eliminado")


def generate_summary_levels(
    full_content: str,
    api_key: str,
    model: Optional[str] = None
) -> Dict[str, Optional[str]]:
    """
    Genera resúmenes en los 3 niveles desde contenido completo
    
    Args:
        full_content: Contenido completo a resumir
        api_key: API key para LLM
        model: Modelo a usar (opcional)
        
    Returns:
        Dict con level_1, level_2, level_3
    """
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        llm = ChatOpenAI(
            model=model or "gpt-3.5-turbo",
            temperature=0.3,
            api_key=api_key
        )
        
        results = {
            "level_1": None,  # 80% del contenido
            "level_2": None,  # 50% del contenido
            "level_3": None   # 20% del contenido
        }
        
        # Generar nivel 1 (detallado): 80% del contenido
        prompt_level_1 = f"""Resume el siguiente contenido manteniendo aproximadamente el 80% de la información importante.
Estructura el resumen de forma clara y organizada, manteniendo todos los conceptos clave, ejemplos importantes y detalles relevantes.

CONTENIDO:
{full_content[:50000]}  # Limitar a 50k caracteres

Genera un resumen detallado que preserve la mayor parte de la información:"""
        
        response_1 = llm.invoke([
            SystemMessage(content="Eres un experto en resumir contenido educativo manteniendo la mayor parte de la información."),
            HumanMessage(content=prompt_level_1)
        ])
        results["level_1"] = response_1.content
        
        # Generar nivel 2 (medio): 50% del contenido (usar level_1 como base)
        prompt_level_2 = f"""Resume el siguiente contenido manteniendo aproximadamente el 50% de la información más importante.
Enfócate en conceptos clave, definiciones importantes y ejemplos principales.

CONTENIDO:
{results['level_1'][:30000]}

Genera un resumen medio que preserve los conceptos más importantes:"""
        
        response_2 = llm.invoke([
            SystemMessage(content="Eres un experto en resumir contenido educativo extrayendo los conceptos más importantes."),
            HumanMessage(content=prompt_level_2)
        ])
        results["level_2"] = response_2.content
        
        # Generar nivel 3 (breve): 20% del contenido (usar level_2 como base)
        prompt_level_3 = f"""Crea un resumen muy breve (20% del contenido) con solo los conceptos esenciales y puntos clave.

CONTENIDO:
{results['level_2'][:15000]}

Genera un resumen ejecutivo con solo los conceptos más importantes:"""
        
        response_3 = llm.invoke([
            SystemMessage(content="Eres un experto en crear resúmenes ejecutivos muy breves con solo lo esencial."),
            HumanMessage(content=prompt_level_3)
        ])
        results["level_3"] = response_3.content
        
        return results
        
    except Exception as e:
        print(f"⚠️ Error generando niveles de resumen: {e}")
        return {
            "level_1": None,
            "level_2": None,
            "level_3": None
        }

