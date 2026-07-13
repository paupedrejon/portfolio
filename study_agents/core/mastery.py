"""
Knowledge tracing simplificado (BKT) — Fase 1.
Actualiza el dominio 0–1 por micro-concepto tras cada respuesta.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional


def update_mastery(
    current: float,
    correct: bool,
    *,
    last_practiced: Optional[datetime] = None,
) -> float:
    """Actualiza el score de dominio tras una respuesta."""
    m = max(0.0, min(1.0, current))
    if correct:
        m = m + (1.0 - m) * 0.35
    else:
        m = m * 0.6

    if last_practiced:
        days = (datetime.now(timezone.utc) - last_practiced).days
        if days > 0:
            decay = min(0.02 * days, m * 0.15)
            floor = 0.2 if current >= 0.7 else 0.0
            m = max(floor, m - decay)

    return round(max(0.0, min(1.0, m)), 4)


def mastery_map_from_records(records: Dict[str, Dict]) -> Dict[str, float]:
    """Convierte registros persistidos a mapa concept_id → mastery."""
    return {
        concept_id: float(data.get("mastery", 0.0))
        for concept_id, data in records.items()
    }
