"""
Persistencia de tarjetas SRS por usuario (Fase 1).
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.fsrs import FsrsState, create_card, rating_from_string, review

_ROOT = Path(__file__).resolve().parent.parent
CARDS_DIR = _ROOT / "data" / "cards"


def _safe_id(user_id: str) -> str:
    return re.sub(r"[^\w\-]+", "_", user_id)[:120] or "default"


def cards_path(user_id: str) -> Path:
    return CARDS_DIR / f"{_safe_id(user_id)}.json"


def load_cards(user_id: str) -> List[Dict[str, Any]]:
    path = cards_path(user_id)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return list(data.get("cards") or [])
    except Exception:
        return []


def save_cards(user_id: str, cards: List[Dict[str, Any]]) -> None:
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "user_id": user_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "cards": cards,
    }
    cards_path(user_id).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _parse_dt(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


def _state_from_card(card: Dict[str, Any]) -> FsrsState:
    return FsrsState(
        stability=float(card.get("stability") or 1.0),
        difficulty=float(card.get("difficulty") or 5.0),
        due=_parse_dt(card.get("due_date")),
        last_review=_parse_dt(card.get("last_review")) if card.get("last_review") else None,
        reps=int(card.get("reps") or 0),
        lapses=int(card.get("lapses") or 0),
    )


def _apply_state(card: Dict[str, Any], state: FsrsState) -> Dict[str, Any]:
    card = dict(card)
    card["stability"] = state.stability
    card["difficulty"] = state.difficulty
    card["due_date"] = state.due.isoformat()
    card["last_review"] = state.last_review.isoformat() if state.last_review else None
    card["reps"] = state.reps
    card["lapses"] = state.lapses
    return card


def create_card_from_error(
    user_id: str,
    *,
    chat_id: str,
    front: str,
    back: str,
    concept_id: Optional[str] = None,
    source: str = "test_error",
) -> Dict[str, Any]:
    """Crea tarjeta nacida de un fallo (due pronto)."""
    cards = load_cards(user_id)
    for c in cards:
        if c.get("chat_id") == chat_id and c.get("front", "").strip() == front.strip():
            return c

    now = datetime.now(timezone.utc)
    state = create_card(grade=1)
    state.due = now  # pendiente de inmediato tras un fallo
    state.stability = max(0.5, state.stability * 0.5)

    card = {
        "card_id": uuid.uuid4().hex[:12],
        "chat_id": chat_id,
        "concept_id": concept_id,
        "front": front.strip(),
        "back": back.strip(),
        "source": source,
        "created_at": now.isoformat(),
        "stability": state.stability,
        "difficulty": state.difficulty,
        "due_date": state.due.isoformat(),
        "last_review": state.last_review.isoformat() if state.last_review else None,
        "reps": state.reps,
        "lapses": state.lapses,
    }
    cards.append(card)
    save_cards(user_id, cards)
    return card


def due_cards(
    user_id: str,
    *,
    chat_id: Optional[str] = None,
    now: Optional[datetime] = None,
    limit: int = 40,
) -> List[Dict[str, Any]]:
    now = now or datetime.now(timezone.utc)
    cards = load_cards(user_id)
    due = []
    for c in cards:
        if chat_id and c.get("chat_id") != chat_id:
            continue
        if _parse_dt(c.get("due_date")) <= now:
            due.append(c)

    # Interleaving por concept_id
    by_concept: Dict[str, List[Dict[str, Any]]] = {}
    for c in due:
        key = c.get("concept_id") or "_none"
        by_concept.setdefault(key, []).append(c)

    interleaved: List[Dict[str, Any]] = []
    queues = list(by_concept.values())
    while queues and len(interleaved) < limit:
        next_queues = []
        for q in queues:
            if not q:
                continue
            interleaved.append(q.pop(0))
            if q:
                next_queues.append(q)
            if len(interleaved) >= limit:
                break
        queues = next_queues

    return interleaved


def count_due(user_id: str, chat_id: Optional[str] = None) -> int:
    return len(due_cards(user_id, chat_id=chat_id, limit=10_000))


def review_card(user_id: str, card_id: str, rating: str) -> Dict[str, Any]:
    grade = rating_from_string(rating)
    cards = load_cards(user_id)
    updated = None
    for i, c in enumerate(cards):
        if c.get("card_id") == card_id:
            state = review(_state_from_card(c), grade)
            cards[i] = _apply_state(c, state)
            updated = cards[i]
            break
    if not updated:
        raise KeyError(f"Tarjeta no encontrada: {card_id}")
    save_cards(user_id, cards)
    return updated


def generate_from_errors(
    user_id: str,
    chat_id: str,
    errors: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """errors: [{question, explanation, correct_answer, concept_ids?}]"""
    created = []
    for err in errors:
        question = str(err.get("question") or "").strip()
        if not question:
            continue
        cids = err.get("concept_ids") or []
        concept_id = cids[0] if isinstance(cids, list) and cids else None
        explanation = str(err.get("explanation") or err.get("feedback") or "").strip()
        correct = str(err.get("correct_answer") or "").strip()
        back = explanation or f"Respuesta correcta: {correct}"
        if correct and correct not in back:
            back = f"{back}\n\nRespuesta correcta: {correct}"
        card = create_card_from_error(
            user_id,
            chat_id=chat_id,
            front=question,
            back=back,
            concept_id=concept_id,
            source="test_error",
        )
        created.append(card)
    return created
