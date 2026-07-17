"""
Almacenamiento JSON de conceptos y mastery por chat (Fase 1).
Migrará a Supabase en Fase 3.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.mastery import update_mastery

# study_agents/data/...
_ROOT = Path(__file__).resolve().parent.parent
CONCEPTS_DIR = _ROOT / "data" / "concepts"
MASTERY_DIR = _ROOT / "data" / "mastery"


def _safe_id(chat_id: str) -> str:
    return re.sub(r"[^\w\-]+", "_", chat_id)[:120] or "default"


def _ensure_dirs() -> None:
    CONCEPTS_DIR.mkdir(parents=True, exist_ok=True)
    MASTERY_DIR.mkdir(parents=True, exist_ok=True)


def concepts_path(chat_id: str) -> Path:
    return CONCEPTS_DIR / f"{_safe_id(chat_id)}.json"


def mastery_path(chat_id: str) -> Path:
    return MASTERY_DIR / f"{_safe_id(chat_id)}.json"


def load_concepts(chat_id: str) -> List[Dict[str, Any]]:
    path = concepts_path(chat_id)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return list(data.get("concepts") or [])
    except Exception:
        return []


def save_concepts(chat_id: str, concepts: List[Dict[str, Any]], meta: Optional[Dict] = None) -> None:
    _ensure_dirs()
    payload = {
        "chat_id": chat_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "concepts": concepts,
        "meta": meta or {},
    }
    concepts_path(chat_id).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_mastery_records(chat_id: str) -> Dict[str, Dict[str, Any]]:
    path = mastery_path(chat_id)
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return dict(data.get("records") or {})
    except Exception:
        return {}


def save_mastery_records(chat_id: str, records: Dict[str, Dict[str, Any]]) -> None:
    _ensure_dirs()
    payload = {
        "chat_id": chat_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
    mastery_path(chat_id).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_mastery_map(chat_id: str) -> Dict[str, float]:
    records = load_mastery_records(chat_id)
    return {
        cid: float(rec.get("mastery", 0.0))
        for cid, rec in records.items()
    }


def apply_mastery_update(chat_id: str, concept_id: str, correct: bool) -> float:
    records = load_mastery_records(chat_id)
    rec = records.get(concept_id) or {"mastery": 0.0, "last_practiced": None}
    last = None
    if rec.get("last_practiced"):
        try:
            last = datetime.fromisoformat(str(rec["last_practiced"]).replace("Z", "+00:00"))
        except Exception:
            last = None
    new_m = update_mastery(float(rec.get("mastery", 0.0)), correct, last_practiced=last)
    records[concept_id] = {
        "mastery": new_m,
        "last_practiced": datetime.now(timezone.utc).isoformat(),
        "attempts": int(rec.get("attempts", 0)) + 1,
        "correct": int(rec.get("correct", 0)) + (1 if correct else 0),
    }
    save_mastery_records(chat_id, records)
    return new_m


def concepts_with_mastery(chat_id: str) -> List[Dict[str, Any]]:
    concepts = load_concepts(chat_id)
    mastery = get_mastery_map(chat_id)
    out = []
    for c in concepts:
        item = dict(c)
        cid = item.get("concept_id") or ""
        item["mastery"] = float(mastery.get(cid, 0.0))
        out.append(item)
    return out


def detect_gaps(chat_id: str, threshold: float = 0.5) -> List[Dict[str, Any]]:
    """Conceptos con mastery < threshold, ordenados por importancia (dependientes)."""
    concepts = concepts_with_mastery(chat_id)
    by_id = {c["concept_id"]: c for c in concepts if c.get("concept_id")}
    dependents: Dict[str, int] = {cid: 0 for cid in by_id}
    for c in concepts:
        for pre in c.get("prerequisites") or []:
            if pre in dependents:
                dependents[pre] += 1

    gaps = []
    for c in concepts:
        m = float(c.get("mastery") or 0.0)
        if m >= threshold:
            continue
        cid = c["concept_id"]
        broken_prereqs = []
        for pre in c.get("prerequisites") or []:
            pre_c = by_id.get(pre)
            if pre_c and float(pre_c.get("mastery") or 0.0) < threshold:
                broken_prereqs.append(pre)
        gaps.append({
            **c,
            "importance": dependents.get(cid, 0),
            "broken_prerequisites": broken_prereqs,
        })
    gaps.sort(key=lambda g: (-g["importance"], g.get("mastery", 0)))
    return gaps
