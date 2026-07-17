"""
Knowledge tracing simplificado (BKT) — Fase 1.
Actualiza el dominio 0–1 por micro-concepto tras cada respuesta.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple


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


def average_mastery(mastery_map: Dict[str, float]) -> float:
    if not mastery_map:
        return 0.0
    values = list(mastery_map.values())
    return sum(values) / len(values)


def target_difficulty_from_mastery(mastery_map: Dict[str, float]) -> str:
    """
    Zona de desarrollo próximo (~70–80% de acierto esperado).
    mastery bajo → easy; medio → medium; alto → hard.
    """
    if not mastery_map:
        return "medium"
    avg = average_mastery(mastery_map)
    if avg < 0.4:
        return "easy"
    if avg < 0.7:
        return "medium"
    return "hard"


def user_level_from_mastery(mastery_map: Dict[str, float]) -> int:
    """Mapea mastery medio 0–1 a nivel legacy 0–10."""
    if not mastery_map:
        return 5
    return max(0, min(10, int(round(average_mastery(mastery_map) * 10))))


def focus_concepts_for_practice(
    concepts: List[Dict],
    *,
    limit: int = 5,
) -> List[str]:
    """
    Elige micro-conceptos en ZPD (ni triviales ni imposibles).
    Prioriza mastery 0.2–0.75, luego por importancia (nº de dependientes).
    """
    if not concepts:
        return []

    by_id = {c.get("concept_id"): c for c in concepts if c.get("concept_id")}
    dependents: Dict[str, int] = {cid: 0 for cid in by_id}
    for c in concepts:
        for pre in c.get("prerequisites") or []:
            if pre in dependents:
                dependents[pre] += 1

    scored: List[Tuple[float, int, str, str]] = []
    for c in concepts:
        cid = c.get("concept_id")
        if not cid:
            continue
        m = float(c.get("mastery") or 0.0)
        # Preferir ZPD; fuera de rango penaliza
        if 0.2 <= m <= 0.75:
            zpd_score = 1.0 - abs(m - 0.55)
        elif m < 0.2:
            zpd_score = 0.35
        else:
            zpd_score = 0.15
        scored.append((zpd_score, dependents.get(cid, 0), cid, c.get("name") or cid))

    scored.sort(key=lambda x: (-x[0], -x[1]))
    return [f"{name} ({cid})" for _, __, cid, name in scored[:limit]]


def suggest_weak_prerequisite(
    concept_ids: List[str],
    concepts: List[Dict],
    *,
    threshold: float = 0.5,
) -> Optional[Dict]:
    """Tras un fallo, sugiere el prerrequisito más débil relacionado."""
    by_id = {c.get("concept_id"): c for c in concepts if c.get("concept_id")}
    best = None
    best_m = 1.0
    for cid in concept_ids:
        c = by_id.get(cid)
        if not c:
            continue
        for pre in c.get("prerequisites") or []:
            pre_c = by_id.get(pre)
            if not pre_c:
                continue
            m = float(pre_c.get("mastery") or 0.0)
            if m < threshold and m < best_m:
                best_m = m
                best = {
                    "concept_id": pre,
                    "name": pre_c.get("name") or pre,
                    "mastery": m,
                }
    return best
