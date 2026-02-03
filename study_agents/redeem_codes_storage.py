"""
Sistema de almacenamiento de Códigos Canjeables
Gestiona códigos promocionales que pueden añadir saldo a las wallets
"""

import json
import os
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
import uuid

# Directorio para almacenar códigos
REDEEM_CODES_DIR = Path("redeem_codes")
REDEEM_CODES_DIR.mkdir(exist_ok=True)

# Archivo principal de códigos
REDEEM_CODES_FILE = REDEEM_CODES_DIR / "all_codes.json"


def get_redeem_codes_file() -> Path:
    """Obtiene la ruta del archivo de códigos"""
    return REDEEM_CODES_FILE


def load_all_codes() -> Dict[str, Dict]:
    """Carga todos los códigos canjeables"""
    if not REDEEM_CODES_FILE.exists():
        return {}
    
    try:
        with open(REDEEM_CODES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error al cargar códigos: {e}")
        return {}


def save_all_codes(codes: Dict[str, Dict]):
    """Guarda todos los códigos"""
    with open(REDEEM_CODES_FILE, "w", encoding="utf-8") as f:
        json.dump(codes, f, ensure_ascii=False, indent=2)


def create_redeem_code(
    amount: float,
    creator_id: str,
    max_uses: Optional[int] = None,  # None = ilimitado
    expires_at: Optional[str] = None,  # Fecha ISO de expiración
    description: Optional[str] = None,
    code: Optional[str] = None  # Si no se proporciona, se genera automáticamente
) -> Dict:
    """
    Crea un nuevo código canjeable
    
    Args:
        amount: Cantidad de saldo que añade el código (en euros)
        creator_id: ID del administrador que crea el código
        max_uses: Número máximo de veces que se puede usar (None = ilimitado)
        expires_at: Fecha de expiración en formato ISO (None = sin expiración)
        description: Descripción opcional del código
        code: Código personalizado (si no se proporciona, se genera uno aleatorio)
        
    Returns:
        Datos del código creado
    """
    if code is None:
        # Generar código aleatorio de 8 caracteres alfanuméricos en mayúsculas
        code = uuid.uuid4().hex[:8].upper()
    
    # Verificar que el código no exista
    all_codes = load_all_codes()
    if code in all_codes:
        raise ValueError(f"El código {code} ya existe")
    
    code_data = {
        "code": code,
        "amount": amount,
        "creator_id": creator_id,
        "max_uses": max_uses,
        "current_uses": 0,
        "expires_at": expires_at,
        "description": description,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "is_active": True
    }
    
    all_codes[code] = code_data
    save_all_codes(all_codes)
    
    return code_data


def get_code(code: str) -> Optional[Dict]:
    """Obtiene un código por su valor"""
    all_codes = load_all_codes()
    return all_codes.get(code)


def redeem_code(code: str, user_id: str) -> Dict:
    """
    Canjea un código para un usuario
    
    Args:
        code: Código a canjear
        user_id: ID del usuario que canjea el código
        
    Returns:
        Diccionario con success, amount, message
        
    Raises:
        ValueError: Si el código no es válido o no se puede canjear
    """
    all_codes = load_all_codes()
    code_data = all_codes.get(code.upper())
    
    if not code_data:
        raise ValueError("Código no encontrado")
    
    if not code_data.get("is_active", True):
        raise ValueError("El código no está activo")
    
    # Verificar expiración
    if code_data.get("expires_at"):
        expires_at = datetime.fromisoformat(code_data["expires_at"])
        if datetime.now() > expires_at:
            raise ValueError("El código ha expirado")
    
    # Verificar límite de usos
    if code_data.get("max_uses") is not None:
        if code_data.get("current_uses", 0) >= code_data["max_uses"]:
            raise ValueError("El código ha alcanzado su límite de usos")
    
    # Verificar si el usuario ya ha usado este código
    # (opcional: podríamos permitir múltiples usos por usuario)
    # Por ahora, permitimos que un usuario use el mismo código múltiples veces
    
    # Actualizar contador de usos
    code_data["current_uses"] = code_data.get("current_uses", 0) + 1
    code_data["updated_at"] = datetime.now().isoformat()
    
    # Guardar cambios
    all_codes[code.upper()] = code_data
    save_all_codes(all_codes)
    
    return {
        "success": True,
        "amount": code_data["amount"],
        "code": code.upper(),
        "message": f"Código canjeado correctamente. Se han añadido {code_data['amount']}€ a tu wallet."
    }


def list_codes(creator_id: Optional[str] = None, active_only: bool = True) -> List[Dict]:
    """
    Lista todos los códigos
    
    Args:
        creator_id: Si se proporciona, filtra por creador
        active_only: Si es True, solo muestra códigos activos
        
    Returns:
        Lista de códigos
    """
    all_codes = load_all_codes()
    
    codes_list = []
    for code, code_data in all_codes.items():
        if active_only and not code_data.get("is_active", True):
            continue
        
        if creator_id and code_data.get("creator_id") != creator_id:
            continue
        
        codes_list.append(code_data)
    
    # Ordenar por fecha de creación (más recientes primero)
    codes_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return codes_list


def deactivate_code(code: str) -> bool:
    """Desactiva un código"""
    all_codes = load_all_codes()
    if code.upper() not in all_codes:
        return False
    
    all_codes[code.upper()]["is_active"] = False
    all_codes[code.upper()]["updated_at"] = datetime.now().isoformat()
    save_all_codes(all_codes)
    return True


def activate_code(code: str) -> bool:
    """Activa un código"""
    all_codes = load_all_codes()
    if code.upper() not in all_codes:
        return False
    
    all_codes[code.upper()]["is_active"] = True
    all_codes[code.upper()]["updated_at"] = datetime.now().isoformat()
    save_all_codes(all_codes)
    return True

