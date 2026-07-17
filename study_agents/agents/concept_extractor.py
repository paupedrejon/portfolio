"""
ConceptExtractorAgent — extrae micro-conceptos de un documento/chat (Fase 1).
"""

from __future__ import annotations

import json
import re
import uuid
from typing import Any, Dict, List, Optional


def _slug(name: str) -> str:
    base = re.sub(r"[^\w\s\-]", "", name.lower(), flags=re.UNICODE)
    base = re.sub(r"[\s_]+", "-", base.strip())[:48]
    return base or uuid.uuid4().hex[:10]


class ConceptExtractorAgent:
    """
    Extrae 10–40 micro-conceptos con prerrequisitos a partir de texto
    (fragmentos RAG del chat o texto libre).
    """

    def __init__(self, llm: Any = None):
        self.llm = llm

    def extract_from_text(
        self,
        text: str,
        *,
        source_doc: Optional[str] = None,
        max_concepts: int = 25,
    ) -> List[Dict[str, Any]]:
        text = (text or "").strip()
        if not text:
            return []

        if self.llm is not None:
            try:
                return self._extract_with_llm(text, source_doc=source_doc, max_concepts=max_concepts)
            except Exception as e:
                print(f"⚠️ ConceptExtractor LLM falló, usando heurística: {e}")

        return self._extract_heuristic(text, source_doc=source_doc, max_concepts=max_concepts)

    def _extract_with_llm(
        self,
        text: str,
        *,
        source_doc: Optional[str],
        max_concepts: int,
    ) -> List[Dict[str, Any]]:
        excerpt = text[:12000]
        prompt = f"""Eres un experto en ciencia del aprendizaje. Extrae micro-conceptos del material de estudio.

Material:
\"\"\"
{excerpt}
\"\"\"

Devuelve SOLO un JSON válido (sin markdown) con esta forma:
{{
  "concepts": [
    {{
      "name": "nombre corto del micro-concepto",
      "description": "1 frase",
      "prerequisites": ["nombre de otro concepto de esta lista"]
    }}
  ]
}}

Reglas:
- Entre 10 y {max_concepts} conceptos (micro, no temas amplios).
- prerequisites solo con nombres que también aparezcan en la lista.
- Español si el material está en español.
"""
        raw = self.llm.invoke(prompt)
        content = raw.content if hasattr(raw, "content") else str(raw)
        content = content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
        parsed = json.loads(content)
        items = parsed.get("concepts") or []
        return self._normalize(items, source_doc=source_doc, max_concepts=max_concepts)

    def _extract_heuristic(
        self,
        text: str,
        *,
        source_doc: Optional[str],
        max_concepts: int,
    ) -> List[Dict[str, Any]]:
        """Fallback sin LLM: headings + frases clave."""
        candidates: List[str] = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.match(r"^#{1,3}\s+\S", line) or re.match(r"^\d+[\.\)]\s+\S", line):
                cleaned = re.sub(r"^[#\d\.\)\s]+", "", line)
                cleaned = cleaned.strip(" -:•")
                if 3 < len(cleaned) < 80:
                    candidates.append(cleaned)
            elif line.endswith(":") and 3 < len(line) < 60:
                candidates.append(line.rstrip(":").strip())

        # Frases con mayúsculas / términos técnicos cortos
        for m in re.finditer(r"\b([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\-]{2,}(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ\-]{2,}){0,3})\b", text):
            phrase = m.group(1).strip()
            if phrase.lower() not in {"the", "this", "that", "with", "from"}:
                candidates.append(phrase)

        seen = set()
        unique: List[str] = []
        for c in candidates:
            key = c.lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(c)
            if len(unique) >= max_concepts:
                break

        items = [{"name": n, "description": f"Concepto detectado en el material: {n}", "prerequisites": []} for n in unique]
        return self._normalize(items, source_doc=source_doc, max_concepts=max_concepts)

    def _normalize(
        self,
        items: List[Dict[str, Any]],
        *,
        source_doc: Optional[str],
        max_concepts: int,
    ) -> List[Dict[str, Any]]:
        name_to_id: Dict[str, str] = {}
        normalized: List[Dict[str, Any]] = []
        for raw in items[:max_concepts]:
            name = str(raw.get("name") or "").strip()
            if not name:
                continue
            cid = _slug(name)
            # evitar colisiones
            base = cid
            n = 2
            while cid in name_to_id.values():
                cid = f"{base}-{n}"
                n += 1
            name_to_id[name.lower()] = cid
            normalized.append({
                "concept_id": cid,
                "name": name,
                "description": str(raw.get("description") or "")[:300],
                "prerequisites": [],
                "source_doc": source_doc,
                "source_pages": raw.get("source_pages") or [],
            })

        # Resolver prerequisites por nombre → id
        id_by_name = {c["name"].lower(): c["concept_id"] for c in normalized}
        for i, raw in enumerate(items[: len(normalized)]):
            prereq_names = raw.get("prerequisites") or []
            resolved = []
            for p in prereq_names:
                pid = id_by_name.get(str(p).lower())
                if pid and pid != normalized[i]["concept_id"]:
                    resolved.append(pid)
            normalized[i]["prerequisites"] = resolved

        return normalized
