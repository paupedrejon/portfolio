"""
Sistema de almacenamiento de conversaciones
Guarda las conversaciones de los usuarios en archivos JSON
"""

import json
import os
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

# Directorio para almacenar conversaciones
CHATS_DIR = Path("chats")
CHATS_DIR.mkdir(exist_ok=True)


def get_chat_file_path(user_id: str, chat_id: str) -> Path:
    """Obtiene la ruta del archivo de chat"""
    user_dir = CHATS_DIR / user_id
    user_dir.mkdir(exist_ok=True)
    return user_dir / f"{chat_id}.json"


def save_chat(user_id: str, chat_id: str, title: str, messages: List[Dict], metadata: Optional[Dict] = None) -> Dict:
    """
    Guarda una conversación
    
    Args:
        user_id: ID del usuario
        chat_id: ID único de la conversación
        title: Título de la conversación
        messages: Lista de mensajes
        metadata: Metadatos adicionales (uploadedFiles, etc.)
        
    Returns:
        Información del chat guardado
    """
    chat_file = get_chat_file_path(user_id, chat_id)
    
    # Si el chat ya existe, actualizar en lugar de crear uno nuevo
    if chat_file.exists():
        # Cargar datos existentes
        with open(chat_file, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
        
        # Actualizar solo los campos que han cambiado
        chat_data = {
            "chat_id": chat_id,
            "user_id": user_id,
            "title": title or existing_data.get("title", "Nueva conversación"),
            "messages": messages,  # Actualizar mensajes
            "created_at": existing_data.get("created_at", datetime.now().isoformat()),
            "updated_at": datetime.now().isoformat(),
            "metadata": {**existing_data.get("metadata", {}), **(metadata or {})}
        }
    else:
        # Crear nuevo chat
        chat_data = {
            "chat_id": chat_id,
            "user_id": user_id,
            "title": title or "Nueva conversación",
            "messages": messages,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
    
    with open(chat_file, "w", encoding="utf-8") as f:
        json.dump(chat_data, f, ensure_ascii=False, indent=2)
    
    return chat_data


def load_chat(user_id: str, chat_id: str) -> Optional[Dict]:
    """
    Carga una conversación
    
    Args:
        user_id: ID del usuario
        chat_id: ID de la conversación
        
    Returns:
        Datos del chat o None si no existe
    """
    chat_file = get_chat_file_path(user_id, chat_id)
    
    if not chat_file.exists():
        return None
    
    with open(chat_file, "r", encoding="utf-8") as f:
        return json.load(f)


def list_chats(user_id: str) -> List[Dict]:
    """
    Lista todas las conversaciones de un usuario
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Lista de chats con información básica
    """
    user_dir = CHATS_DIR / user_id
    
    if not user_dir.exists():
        return []
    
    chats = []
    for chat_file in user_dir.glob("*.json"):
        try:
            with open(chat_file, "r", encoding="utf-8") as f:
                chat_data = json.load(f)
                chats.append({
                    "chat_id": chat_data.get("chat_id"),
                    "title": chat_data.get("title", "Sin título"),
                    "created_at": chat_data.get("created_at"),
                    "updated_at": chat_data.get("updated_at"),
                    "message_count": len(chat_data.get("messages", [])),
                    "metadata": chat_data.get("metadata", {})
                })
        except Exception as e:
            print(f"Error al leer chat {chat_file}: {e}")
            continue
    
    # Ordenar por fecha de actualización (más reciente primero)
    chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    return chats


def update_chat(user_id: str, chat_id: str, messages: List[Dict], title: Optional[str] = None, metadata: Optional[Dict] = None) -> Optional[Dict]:
    """
    Actualiza una conversación existente
    
    Args:
        user_id: ID del usuario
        chat_id: ID de la conversación
        messages: Nueva lista de mensajes
        title: Nuevo título (opcional)
        metadata: Nuevos metadatos (opcional)
        
    Returns:
        Datos del chat actualizado o None si no existe
    """
    chat_file = get_chat_file_path(user_id, chat_id)
    
    if not chat_file.exists():
        return None
    
    # Cargar datos existentes
    with open(chat_file, "r", encoding="utf-8") as f:
        chat_data = json.load(f)
    
    # Actualizar
    chat_data["messages"] = messages
    chat_data["updated_at"] = datetime.now().isoformat()
    
    if title:
        chat_data["title"] = title
    
    if metadata:
        chat_data["metadata"] = {**chat_data.get("metadata", {}), **metadata}
    
    # Guardar
    with open(chat_file, "w", encoding="utf-8") as f:
        json.dump(chat_data, f, ensure_ascii=False, indent=2)
    
    return chat_data


def delete_chat(user_id: str, chat_id: str) -> bool:
    """
    Elimina una conversación
    
    Args:
        user_id: ID del usuario
        chat_id: ID de la conversación
        
    Returns:
        True si se eliminó, False si no existía
    """
    chat_file = get_chat_file_path(user_id, chat_id)
    
    if not chat_file.exists():
        return False
    
    chat_file.unlink()
    return True


def generate_chat_id() -> str:
    """Genera un ID único para una conversación"""
    return datetime.now().strftime("%Y%m%d_%H%M%S_%f")


def generate_chat_title(messages: List[Dict]) -> str:
    """
    Genera un título inteligente para la conversación basado en los mensajes
    
    Args:
        messages: Lista de mensajes de la conversación
        
    Returns:
        Título generado (máximo 50 caracteres)
    """
    if not messages:
        return "Nueva conversación"
    
    # Buscar el primer mensaje del usuario
    first_user_message = next(
        (msg.get("content", "") for msg in messages if msg.get("role") == "user"),
        ""
    )
    
    if not first_user_message:
        return "Nueva conversación"
    
    # Limpiar el mensaje
    title = first_user_message.strip()
    
    # Remover saltos de línea y espacios múltiples
    title = " ".join(title.split())
    
    # Remover comandos comunes
    title = title.replace("genera apuntes", "").replace("crea apuntes", "")
    title = title.replace("genera test", "").replace("crea test", "")
    title = title.replace("genera un test", "").replace("crea un test", "")
    title = title.replace("hazme un test", "").replace("quiero un test", "")
    title = " ".join(title.split())  # Limpiar espacios de nuevo
    
    # Extraer palabras clave importantes (sustantivos, verbos principales)
    # Si el mensaje es muy largo, intentar extraer el tema principal
    if len(title) > 100:
        # Buscar palabras después de "sobre", "de", "acerca de", etc.
        keywords = ["sobre", "de", "acerca de", "del", "de la", "de los"]
        for keyword in keywords:
            if keyword in title.lower():
                parts = title.lower().split(keyword, 1)
                if len(parts) > 1:
                    title = parts[1].strip()
                    break
        
        # Si aún es muy largo, tomar las primeras palabras significativas
        words = title.split()
        if len(words) > 8:
            # Tomar las primeras 6-8 palabras
            title = " ".join(words[:8])
    
    # Capitalizar primera letra
    if title:
        title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
    
    # Truncar a 50 caracteres
    if len(title) > 50:
        title = title[:47] + "..."
    
    return title or "Nueva conversación"

