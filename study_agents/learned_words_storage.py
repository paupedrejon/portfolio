"""
Almacenamiento de palabras aprendidas por usuario e idioma
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime


def get_learned_words_file_path(user_id: str, language: str) -> Path:
    """Obtiene la ruta del archivo de palabras aprendidas para un usuario e idioma"""
    base_dir = Path("data/learned_words")
    base_dir.mkdir(parents=True, exist_ok=True)
    user_dir = base_dir / user_id
    user_dir.mkdir(exist_ok=True)
    # Normalizar el nombre del idioma para el archivo
    language_normalized = language.lower().replace(" ", "_").replace("/", "_")
    return user_dir / f"{language_normalized}.json"


def add_learned_word(
    user_id: str, 
    language: str, 
    word: str, 
    translation: str,
    source: str = "unknown",
    example: Optional[str] = None,
    romanization: Optional[str] = None
) -> bool:
    """
    Agrega una palabra aprendida para un usuario e idioma
    
    Args:
        user_id: ID del usuario
        language: Idioma (ej: "Japonés", "Inglés")
        word: Palabra en el idioma objetivo
        translation: Traducción al español
        source: Fuente de la palabra (flashcards, test, conversation, exercise)
        example: Ejemplo de uso (opcional)
        romanization: Romanización (opcional)
        
    Returns:
        True si se agregó correctamente
    """
    try:
        words_file = get_learned_words_file_path(user_id, language)
        
        # Cargar palabras existentes
        learned_words = []
        if words_file.exists():
            with open(words_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                learned_words = data.get("words", [])
        
        # Verificar si la palabra ya existe
        word_exists = any(
            w.get("word") == word and w.get("translation") == translation
            for w in learned_words
        )
        
        if not word_exists:
            # Agregar nueva palabra
            new_word = {
                "word": word,
                "translation": translation,
                "source": source,
                "example": example,
                "romanization": romanization,
                "learned_at": datetime.now().isoformat()
            }
            learned_words.append(new_word)
            
            # Guardar
            data = {
                "user_id": user_id,
                "language": language,
                "words": learned_words,
                "updated_at": datetime.now().isoformat()
            }
            
            with open(words_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True
        
        return False
    except Exception as e:
        print(f"Error adding learned word: {e}")
        return False


def get_learned_words(user_id: str, language: str) -> List[Dict]:
    """
    Obtiene todas las palabras aprendidas para un usuario e idioma
    
    Args:
        user_id: ID del usuario
        language: Idioma
        
    Returns:
        Lista de palabras aprendidas
    """
    try:
        words_file = get_learned_words_file_path(user_id, language)
        
        if not words_file.exists():
            return []
        
        with open(words_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("words", [])
    except Exception as e:
        print(f"Error getting learned words: {e}")
        return []


def get_all_learned_words_count(user_id: str, language: str) -> int:
    """
    Obtiene el conteo de palabras aprendidas para un usuario e idioma
    
    Args:
        user_id: ID del usuario
        language: Idioma
        
    Returns:
        Número de palabras aprendidas
    """
    words = get_learned_words(user_id, language)
    return len(words)


def calculate_level_from_words(word_count: int) -> int:
    """
    Calcula el nivel basado en el número de palabras aprendidas
    
    Nivel 1: 25 palabras
    Nivel 2: 50 palabras
    Nivel 3: 75 palabras
    Nivel 4: 100 palabras
    Nivel 5: 150 palabras
    Nivel 6: 200 palabras
    Nivel 7: 300 palabras
    Nivel 8: 500 palabras
    Nivel 9: 700 palabras
    Nivel 10: 900 palabras
    Nivel 10 (máximo): 1000+ palabras
    
    Args:
        word_count: Número de palabras aprendidas
        
    Returns:
        Nivel (0-10)
    """
    if word_count < 25:
        return 0
    elif word_count < 50:
        return 1
    elif word_count < 75:
        return 2
    elif word_count < 100:
        return 3
    elif word_count < 150:
        return 4
    elif word_count < 200:
        return 5
    elif word_count < 300:
        return 6
    elif word_count < 500:
        return 7
    elif word_count < 700:
        return 8
    elif word_count < 900:
        return 9
    else:
        return 10

