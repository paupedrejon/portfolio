"""
FSRS simplificado (Fase 1) — fórmulas públicas del DSR model.
Usa pesos por defecto de FSRS-4.5 (aprox.) para scheduling sin entrenar.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, Tuple

Rating = Literal[1, 2, 3, 4]  # Again, Hard, Good, Easy

# Pesos por defecto (FSRS-4.5 defaults, redondeados)
W = [
    0.4072, 1.1829, 3.1262, 15.4722,  # w0-w3 init stability
    7.2102, 0.5316, 1.0651, 0.0234,  # w4-w7 difficulty
    1.616, 0.111, 1.075,  # w8-w10 recall
    1.947, 0.0195, 0.3105, 0.3975,  # w11-w14 forget
    0.2, 2.9, 0.48, 0.64,  # w15-w18 hard/easy/short-term
]

DECAY = -0.5
FACTOR = 0.9 ** (1 / DECAY) - 1


@dataclass
class FsrsState:
    stability: float
    difficulty: float
    due: datetime
    last_review: Optional[datetime] = None
    reps: int = 0
    lapses: int = 0


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def retrievability(elapsed_days: float, stability: float) -> float:
    if stability <= 0:
        return 0.0
    return (1 + FACTOR * elapsed_days / (9 * stability)) ** DECAY


def init_difficulty(grade: Rating) -> float:
    d = W[4] - math.exp(W[5] * (grade - 1)) + 1
    return clamp(d, 1.0, 10.0)


def init_stability(grade: Rating) -> float:
    return max(W[grade - 1], 0.1)


def next_difficulty(d: float, grade: Rating) -> float:
    delta = -W[6] * (grade - 3)
    # linear damping
    next_d = d + delta * (10 - d) / 9
    # mean reversion toward D0(Easy≈4)
    d0_easy = init_difficulty(4)
    next_d = W[7] * d0_easy + (1 - W[7]) * next_d
    return clamp(next_d, 1.0, 10.0)


def next_recall_stability(d: float, s: float, r: float, grade: Rating) -> float:
    hard_pen = W[15] if grade == 2 else 1.0
    easy_bon = W[16] if grade == 4 else 1.0
    return s * (
        1
        + math.exp(W[8])
        * (11 - d)
        * (s ** (-W[9]))
        * (math.exp(W[10] * (1 - r)) - 1)
        * hard_pen
        * easy_bon
    )


def next_forget_stability(d: float, s: float, r: float) -> float:
    return (
        W[11]
        * (d ** (-W[12]))
        * (((s + 1) ** W[13]) - 1)
        * math.exp(W[14] * (1 - r))
    )


def next_interval_days(stability: float, request_retention: float = 0.9) -> float:
    """Días hasta que R caiga a request_retention."""
    if stability <= 0:
        return 1.0
    # R = (1 + FACTOR * t / (9S))^DECAY = request_retention
    # t = 9S / FACTOR * (R^(1/DECAY) - 1)
    t = (stability / FACTOR) * (request_retention ** (1 / DECAY) - 1) * 9
    return max(1.0, t)


def create_card(grade: Rating = 3, now: Optional[datetime] = None) -> FsrsState:
    now = now or datetime.now(timezone.utc)
    s = init_stability(grade)
    d = init_difficulty(grade)
    days = next_interval_days(s)
    return FsrsState(
        stability=round(s, 4),
        difficulty=round(d, 4),
        due=now + timedelta(days=days),
        last_review=now,
        reps=1,
        lapses=0 if grade > 1 else 1,
    )


def review(
    state: FsrsState,
    grade: Rating,
    now: Optional[datetime] = None,
) -> FsrsState:
    now = now or datetime.now(timezone.utc)
    last = state.last_review or now
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    elapsed = max(0.0, (now - last).total_seconds() / 86400.0)
    r = retrievability(elapsed, state.stability)
    d = next_difficulty(state.difficulty, grade)

    if grade == 1:
        s = next_forget_stability(d, state.stability, r)
        lapses = state.lapses + 1
        # relearning: due soon
        days = min(1.0, next_interval_days(s))
    else:
        s = next_recall_stability(d, state.stability, r, grade)
        lapses = state.lapses
        days = next_interval_days(s)
        if grade == 2:
            days = max(1.0, days * 1.2)
        elif grade == 4:
            days = days * 1.3

    return FsrsState(
        stability=round(max(0.1, s), 4),
        difficulty=round(d, 4),
        due=now + timedelta(days=days),
        last_review=now,
        reps=state.reps + 1,
        lapses=lapses,
    )


def rating_from_string(value: str) -> Rating:
    mapping = {
        "again": 1,
        "hard": 2,
        "good": 3,
        "easy": 4,
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
    }
    key = str(value).strip().lower()
    if key not in mapping:
        raise ValueError(f"Rating inválido: {value}")
    return mapping[key]  # type: ignore[return-value]
