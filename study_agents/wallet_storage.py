"""
Sistema de almacenamiento de Wallet (billetera) de usuarios
Gestiona el dinero de los usuarios y la distribución de ingresos
"""

import json
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path

# Directorio para almacenar wallets
WALLETS_DIR = Path("courses/wallets")
WALLETS_DIR.mkdir(parents=True, exist_ok=True)

# Directorio para almacenar ingresos de creadores
CREATOR_EARNINGS_DIR = Path("courses/creator_earnings")
CREATOR_EARNINGS_DIR.mkdir(parents=True, exist_ok=True)

# Archivo para ingresos de la plataforma
PLATFORM_EARNINGS_FILE = Path("courses/platform_earnings.json")


def get_wallet_file(user_id: str) -> Path:
    """Obtiene la ruta del archivo de wallet de un usuario"""
    return WALLETS_DIR / f"{user_id}.json"


def get_creator_earnings_file(creator_id: str) -> Path:
    """Obtiene la ruta del archivo de ingresos de un creador"""
    return CREATOR_EARNINGS_DIR / f"{creator_id}.json"


def get_user_wallet(user_id: str) -> Dict:
    """
    Obtiene el wallet de un usuario
    
    Returns:
        {
            "balance": float,  # Saldo disponible
            "total_deposited": float,  # Total depositado
            "total_spent": float,  # Total gastado
            "transactions": List[Dict]  # Historial de transacciones
        }
    """
    wallet_file = get_wallet_file(user_id)
    
    if not wallet_file.exists():
        return {
            "balance": 0.0,
            "total_deposited": 0.0,
            "total_spent": 0.0,
            "transactions": []
        }
    
    try:
        with open(wallet_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando wallet de {user_id}: {e}")
        return {
            "balance": 0.0,
            "total_deposited": 0.0,
            "total_spent": 0.0,
            "transactions": []
        }


def save_user_wallet(user_id: str, wallet_data: Dict):
    """Guarda el wallet de un usuario"""
    wallet_file = get_wallet_file(user_id)
    
    with open(wallet_file, "w", encoding="utf-8") as f:
        json.dump(wallet_data, f, ensure_ascii=False, indent=2)


def add_to_wallet(user_id: str, amount: float, transaction_type: str = "deposit", metadata: Optional[Dict] = None) -> Dict:
    """
    Añade dinero al wallet de un usuario
    
    Args:
        user_id: ID del usuario
        amount: Cantidad a añadir (positiva)
        transaction_type: "deposit" o "refund"
        metadata: Información adicional de la transacción
    
    Returns:
        Datos actualizados del wallet
    """
    wallet = get_user_wallet(user_id)
    
    wallet["balance"] = wallet.get("balance", 0.0) + amount
    wallet["total_deposited"] = wallet.get("total_deposited", 0.0) + amount
    
    transaction = {
        "type": transaction_type,
        "amount": amount,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }
    
    wallet.setdefault("transactions", []).append(transaction)
    
    save_user_wallet(user_id, wallet)
    
    return wallet


def deduct_from_wallet(user_id: str, amount: float, transaction_type: str = "purchase", metadata: Optional[Dict] = None) -> Dict:
    """
    Deduce dinero del wallet de un usuario
    
    Args:
        user_id: ID del usuario
        amount: Cantidad a deducir (positiva)
        transaction_type: "purchase", "ai_usage", etc.
        metadata: Información adicional
    
    Returns:
        Datos actualizados del wallet
    
    Raises:
        ValueError: Si no hay suficiente saldo
    """
    wallet = get_user_wallet(user_id)
    
    if wallet["balance"] < amount:
        raise ValueError(f"Saldo insuficiente. Disponible: {wallet['balance']:.2f}€, Necesario: {amount:.2f}€")
    
    wallet["balance"] = wallet.get("balance", 0.0) - amount
    wallet["total_spent"] = wallet.get("total_spent", 0.0) + amount
    
    transaction = {
        "type": transaction_type,
        "amount": -amount,
        "timestamp": datetime.now().isoformat(),
        "metadata": metadata or {}
    }
    
    wallet.setdefault("transactions", []).append(transaction)
    
    save_user_wallet(user_id, wallet)
    
    return wallet


def get_creator_earnings(creator_id: str) -> Dict:
    """
    Obtiene los ingresos acumulados de un creador
    
    Returns:
        {
            "total_earned": float,  # Total ganado
            "available_to_withdraw": float,  # Disponible para retirar (>= 5€)
            "pending": float,  # Pendiente (< 5€)
            "withdrawn": float,  # Total retirado
            "transactions": List[Dict]  # Historial
        }
    """
    earnings_file = get_creator_earnings_file(creator_id)
    
    if not earnings_file.exists():
        return {
            "total_earned": 0.0,
            "available_to_withdraw": 0.0,
            "pending": 0.0,
            "withdrawn": 0.0,
            "transactions": []
        }
    
    try:
        with open(earnings_file, "r", encoding="utf-8") as f:
            earnings = json.load(f)
            # Calcular disponible y pendiente
            total = earnings.get("total_earned", 0.0) - earnings.get("withdrawn", 0.0)
            earnings["available_to_withdraw"] = total if total >= 5.0 else 0.0
            earnings["pending"] = total if total < 5.0 else 0.0
            return earnings
    except Exception as e:
        print(f"Error cargando ingresos de creador {creator_id}: {e}")
        return {
            "total_earned": 0.0,
            "available_to_withdraw": 0.0,
            "pending": 0.0,
            "withdrawn": 0.0,
            "transactions": []
        }


def add_creator_earnings(creator_id: str, amount: float, course_id: str, course_title: str) -> Dict:
    """
    Añade ingresos a un creador por la venta de un curso
    
    Args:
        creator_id: ID del creador
        amount: Cantidad a añadir
        course_id: ID del curso vendido
        course_title: Título del curso
    
    Returns:
        Datos actualizados de ingresos
    """
    earnings = get_creator_earnings(creator_id)
    
    earnings["total_earned"] = earnings.get("total_earned", 0.0) + amount
    
    transaction = {
        "type": "course_sale",
        "amount": amount,
        "course_id": course_id,
        "course_title": course_title,
        "timestamp": datetime.now().isoformat()
    }
    
    earnings.setdefault("transactions", []).append(transaction)
    
    # Guardar
    earnings_file = get_creator_earnings_file(creator_id)
    with open(earnings_file, "w", encoding="utf-8") as f:
        json.dump(earnings, f, ensure_ascii=False, indent=2)
    
    return earnings


def get_platform_earnings() -> Dict:
    """Obtiene los ingresos totales de la plataforma"""
    if not PLATFORM_EARNINGS_FILE.exists():
        return {
            "total_earned": 0.0,
            "transactions": []
        }
    
    try:
        with open(PLATFORM_EARNINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando ingresos de plataforma: {e}")
        return {
            "total_earned": 0.0,
            "transactions": []
        }


def add_platform_earnings(amount: float, course_id: str, course_title: str) -> Dict:
    """Añade ingresos a la plataforma"""
    earnings = get_platform_earnings()
    
    earnings["total_earned"] = earnings.get("total_earned", 0.0) + amount
    
    transaction = {
        "type": "course_sale",
        "amount": amount,
        "course_id": course_id,
        "course_title": course_title,
        "timestamp": datetime.now().isoformat()
    }
    
    earnings.setdefault("transactions", []).append(transaction)
    
    with open(PLATFORM_EARNINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(earnings, f, ensure_ascii=False, indent=2)
    
    return earnings


def distribute_course_payment(user_id: str, course_id: str, course_price: float, course: Dict) -> Dict:
    """
    Distribuye el pago de un curso entre IA, plataforma y creador
    
    Args:
        user_id: ID del usuario que compra
        course_id: ID del curso
        course_price: Precio del curso
        course: Datos del curso (debe incluir revenue_split y creator_id)
    
    Returns:
        {
            "success": bool,
            "distribution": {
                "ai_usage": float,
                "platform": float,
                "creator": float
            },
            "wallet_balance_after": float
        }
    
    Raises:
        ValueError: Si no hay suficiente saldo en wallet
    """
    print(f"[Payment Distribution] 🚀 Iniciando distribución de pago para curso {course_id}")
    print(f"[Payment Distribution] Usuario comprador: {user_id}, Precio: {course_price}€")
    print(f"[Payment Distribution] Datos del curso: {course}")
    
    # Importación tardía para evitar importación circular
    try:
        from study_agents.course_storage import calculate_revenue_split
    except ImportError:
        # Si falla, intentar importación relativa
        import sys
        import os
        course_storage_path = os.path.join(os.path.dirname(__file__), "course_storage.py")
        if os.path.exists(course_storage_path):
            import importlib.util
            spec = importlib.util.spec_from_file_location("course_storage", course_storage_path)
            course_storage = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(course_storage)
            calculate_revenue_split = course_storage.calculate_revenue_split
        else:
            raise ImportError("No se pudo importar course_storage")
    
    # Obtener distribución
    revenue_split = course.get("revenue_split") or calculate_revenue_split(course_price)
    print(f"[Payment Distribution] Distribución calculada: {revenue_split}")
    
    ai_amount = revenue_split.get("ai_usage", 0.0)
    platform_amount = revenue_split.get("platform", 0.0)
    creator_amount = revenue_split.get("creator", 0.0)
    
    # Verificar que la suma sea correcta
    total = ai_amount + platform_amount + creator_amount
    if abs(total - course_price) > 0.01:  # Tolerancia de 1 céntimo
        raise ValueError(f"Distribución incorrecta: {total}€ != {course_price}€")
    
    # Deducir del wallet del usuario (todo el precio del curso)
    print(f"[Payment Distribution] Deduciendo {course_price}€ del wallet del usuario {user_id}")
    wallet = deduct_from_wallet(
        user_id,
        course_price,
        transaction_type="course_purchase",
        metadata={
            "course_id": course_id,
            "course_title": course.get("title", ""),
            "distribution": {
                "ai_usage": ai_amount,
                "platform": platform_amount,
                "creator": creator_amount
            }
        }
    )
    print(f"[Payment Distribution] ✅ Saldo del comprador después: {wallet['balance']}€")
    
    # Añadir saldo directamente al wallet del creador
    creator_id = course.get("creator_id")
    print(f"[Payment Distribution] Creator ID del curso: {creator_id}")
    print(f"[Payment Distribution] Cantidad para el creador: {creator_amount}€")
    
    if not creator_id:
        print(f"[Payment Distribution] ⚠️ ADVERTENCIA: El curso {course_id} no tiene creator_id")
    elif creator_amount <= 0:
        print(f"[Payment Distribution] ⚠️ ADVERTENCIA: La cantidad para el creador es 0 o negativa: {creator_amount}€")
    else:
        # Añadir saldo al wallet del creador
        print(f"[Payment Distribution] Añadiendo {creator_amount}€ al wallet del creador {creator_id}")
        creator_wallet = add_to_wallet(
            creator_id,
            creator_amount,
            transaction_type="course_sale",
            metadata={
                "course_id": course_id,
                "course_title": course.get("title", ""),
                "buyer_id": user_id,
                "amount": creator_amount
            }
        )
        print(f"[Payment Distribution] ✅ Añadidos {creator_amount}€ al wallet del creador {creator_id}")
        print(f"[Payment Distribution] ✅ Saldo del creador después: {creator_wallet['balance']}€")
    
    # Añadir a ingresos de la plataforma
    if platform_amount > 0:
        add_platform_earnings(
            platform_amount,
            course_id,
            course.get("title", "")
        )
    
    return {
        "success": True,
        "distribution": {
            "ai_usage": ai_amount,
            "platform": platform_amount,
            "creator": creator_amount
        },
        "wallet_balance_after": wallet["balance"]
    }


