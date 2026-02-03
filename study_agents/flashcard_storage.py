"""
Sistema de almacenamiento de respuestas de flashcards
Implementa repetición espaciada (Spaced Repetition)
"""

import json
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pathlib import Path

# Directorio para almacenar respuestas de flashcards
FLASHCARD_RESPONSES_DIR = Path("courses/flashcard_responses")
FLASHCARD_RESPONSES_DIR.mkdir(parents=True, exist_ok=True)


def get_flashcard_responses_file(user_id: str, course_id: str) -> Path:
    """Obtiene la ruta del archivo de respuestas de flashcards de un usuario en un curso"""
    return FLASHCARD_RESPONSES_DIR / f"{user_id}_{course_id}.json"


def save_flashcard_response(
    user_id: str,
    course_id: str,
    topic_name: str,
    flashcard_id: str,
    is_correct: bool
) -> Dict:
    """
    Guarda una respuesta de flashcard
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        topic_name: Nombre del tema
        flashcard_id: ID único de la flashcard (puede ser el índice o un hash)
        is_correct: True si la respuesta fue correcta, False si fue incorrecta
        
    Returns:
        Datos de la respuesta guardada
    """
    responses_file = get_flashcard_responses_file(user_id, course_id)
    
    # Cargar respuestas existentes
    if responses_file.exists():
        with open(responses_file, "r", encoding="utf-8") as f:
            responses = json.load(f)
    else:
        responses = {}
    
    # Crear clave única para la flashcard (topic + flashcard_id)
    flashcard_key = f"{topic_name}::{flashcard_id}"
    
    # Obtener historial de respuestas para esta flashcard
    if flashcard_key not in responses:
        responses[flashcard_key] = {
            "topic_name": topic_name,
            "flashcard_id": flashcard_id,
            "responses": [],
            "consecutive_correct": 0,
            "last_response_at": None
        }
    
    flashcard_data = responses[flashcard_key]
    
    # Añadir nueva respuesta
    response_record = {
        "is_correct": is_correct,
        "answered_at": datetime.now().isoformat()
    }
    flashcard_data["responses"].append(response_record)
    flashcard_data["last_response_at"] = datetime.now().isoformat()
    
    # Actualizar contador de respuestas correctas consecutivas
    if is_correct:
        flashcard_data["consecutive_correct"] += 1
    else:
        flashcard_data["consecutive_correct"] = 0
    
    # Guardar
    with open(responses_file, "w", encoding="utf-8") as f:
        json.dump(responses, f, ensure_ascii=False, indent=2)
    
    return flashcard_data


def can_show_flashcard(
    user_id: str,
    course_id: str,
    topic_name: str,
    flashcard_id: str
) -> bool:
    """
    Determina si una flashcard puede mostrarse según la lógica de repetición espaciada
    
    Reglas:
    - Si nunca se ha respondido: puede mostrarse
    - Si se respondió mal la última vez: puede mostrarse después de 10 minutos
    - Si se respondió bien 1 vez: puede mostrarse después de 1 hora
    - Si se respondió bien 2 veces seguidas: puede mostrarse después de 1 día
    - Si se respondió bien 3+ veces seguidas: puede mostrarse después de 10 días
    
    Returns:
        True si la flashcard puede mostrarse, False si debe esperar
    """
    responses_file = get_flashcard_responses_file(user_id, course_id)
    
    if not responses_file.exists():
        return True  # Nunca se ha respondido, puede mostrarse
    
    with open(responses_file, "r", encoding="utf-8") as f:
        responses = json.load(f)
    
    flashcard_key = f"{topic_name}::{flashcard_id}"
    
    if flashcard_key not in responses:
        return True  # Esta flashcard nunca se ha respondido
    
    flashcard_data = responses[flashcard_key]
    responses_list = flashcard_data.get("responses", [])
    
    if not responses_list:
        return True  # No hay respuestas, puede mostrarse
    
    # Obtener última respuesta
    last_response = responses_list[-1]
    last_response_time = datetime.fromisoformat(last_response["answered_at"])
    now = datetime.now()
    time_since_last = now - last_response_time
    
    consecutive_correct = flashcard_data.get("consecutive_correct", 0)
    last_was_correct = last_response.get("is_correct", False)
    
    # Si la última respuesta fue incorrecta: puede mostrarse después de 10 minutos
    if not last_was_correct:
        return time_since_last >= timedelta(minutes=10)
    
    # Si la última respuesta fue correcta, aplicar reglas según número de aciertos consecutivos
    if consecutive_correct == 1:
        # Primera vez correcta: esperar 1 hora
        return time_since_last >= timedelta(hours=1)
    elif consecutive_correct == 2:
        # Segunda vez correcta consecutiva: esperar 1 día
        return time_since_last >= timedelta(days=1)
    elif consecutive_correct >= 3:
        # Tercera vez o más correcta consecutiva: esperar 10 días
        return time_since_last >= timedelta(days=10)
    
    return True  # Por defecto, puede mostrarse


def get_available_flashcards(
    user_id: str,
    course_id: str,
    topic_name: str,
    all_flashcards: List[Dict]
) -> List[Dict]:
    """
    Filtra las flashcards disponibles para mostrar según la lógica de repetición espaciada
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        topic_name: Nombre del tema
        all_flashcards: Lista completa de flashcards del tema
        
    Returns:
        Lista de flashcards que pueden mostrarse ahora
    """
    available = []
    
    for idx, flashcard in enumerate(all_flashcards):
        flashcard_id = flashcard.get("id", str(idx))
        
        if can_show_flashcard(user_id, course_id, topic_name, flashcard_id):
            available.append(flashcard)
    
    return available


def get_flashcard_stats(
    user_id: str,
    course_id: str,
    topic_name: Optional[str] = None
) -> Dict:
    """
    Obtiene estadísticas de flashcards para un usuario
    
    Args:
        user_id: ID del usuario
        course_id: ID del curso
        topic_name: Si se proporciona, filtra por tema
        
    Returns:
        Diccionario con estadísticas
    """
    responses_file = get_flashcard_responses_file(user_id, course_id)
    
    if not responses_file.exists():
        return {
            "total_flashcards": 0,
            "total_responses": 0,
            "correct_responses": 0,
            "incorrect_responses": 0,
            "accuracy": 0.0,
            "by_topic": {}
        }
    
    with open(responses_file, "r", encoding="utf-8") as f:
        responses = json.load(f)
    
    total_responses = 0
    correct_responses = 0
    incorrect_responses = 0
    by_topic = {}
    
    for flashcard_key, flashcard_data in responses.items():
        topic = flashcard_data.get("topic_name", "unknown")
        
        if topic_name and topic != topic_name:
            continue
        
        if topic not in by_topic:
            by_topic[topic] = {
                "total": 0,
                "correct": 0,
                "incorrect": 0
            }
        
        flashcard_responses = flashcard_data.get("responses", [])
        for response in flashcard_responses:
            total_responses += 1
            by_topic[topic]["total"] += 1
            
            if response.get("is_correct"):
                correct_responses += 1
                by_topic[topic]["correct"] += 1
            else:
                incorrect_responses += 1
                by_topic[topic]["incorrect"] += 1
    
    accuracy = (correct_responses / total_responses * 100) if total_responses > 0 else 0.0
    
    return {
        "total_flashcards": len(responses),
        "total_responses": total_responses,
        "correct_responses": correct_responses,
        "incorrect_responses": incorrect_responses,
        "accuracy": round(accuracy, 2),
        "by_topic": by_topic
    }


