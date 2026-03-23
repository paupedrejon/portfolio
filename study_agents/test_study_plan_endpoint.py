"""
Prueba rápida del endpoint POST /api/generate-study-plan
Uso:  python test_study_plan_endpoint.py
Requiere backend en FASTAPI_URL (default http://127.0.0.1:8000) y OPENAI_API_KEY en el entorno o en .env del proyecto.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

BASE = os.getenv("FASTAPI_URL", "http://127.0.0.1:8000").rstrip("/")


def load_key() -> str:
    k = os.getenv("OPENAI_API_KEY", "").strip()
    if k:
        return k
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.is_file():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip()
    return ""


def main() -> int:
    key = load_key()
    if not key:
        print("SKIP: sin OPENAI_API_KEY")
        return 0

    r = requests.post(
        f"{BASE}/api/generate-study-plan",
        json={
            "apiKey": key,
            "topic": "SQL y diseño de bases de datos",
            "days": 5,
            "minutes_per_day": 40,
            "goal": "Preparar un examen parcial práctico",
            "user_id": "test-study-plan-user",
            "chat_id": "test-study-plan-chat",
        },
        timeout=300,
    )
    print("HTTP", r.status_code)
    if r.status_code != 200:
        print(r.text[:500])
        return 1
    data = r.json()
    if not data.get("success"):
        print("FAIL", data)
        return 1
    plan = data.get("plan") or ""
    if not plan.startswith("#"):
        print("WARN: plan no empieza con #")
    required = ["Calendario", "Técnicas", "Study Agents"]
    missing = [x for x in required if x not in plan]
    if missing:
        print("WARN: faltan secciones esperadas:", missing)
    else:
        print("OK: secciones clave presentes")
    print("Preview:\n", plan[:600].replace("\n", "\n") + "...")
    return 0


if __name__ == "__main__":
    sys.exit(main())
