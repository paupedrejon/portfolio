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


_STOP_PHRASES = {
    "the", "this", "that", "with", "from", "página", "pagina", "índice", "indice",
    "contenido", "introducción", "introduccion", "capítulo", "capitulo", "anexo",
    "bibliografía", "bibliografia", "resumen", "abstract", "table of contents",
    "copyright", "universidad", "asignatura", "pdf",
}


class ConceptExtractorAgent:
    """
    Extrae 10–40 micro-conceptos con prerrequisitos a partir de texto
    (fragmentos RAG del chat, conversación o texto libre).
    """

    def __init__(self, llm: Any = None):
        self.llm = llm

    def extract_from_text(
        self,
        text: str,
        *,
        source_doc: Optional[str] = None,
        max_concepts: int = 25,
        conversation_excerpt: Optional[str] = None,
        topic_hint: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        text = (text or "").strip()
        if not text and not (conversation_excerpt or "").strip():
            return []

        if self.llm is not None:
            try:
                return self._extract_with_llm(
                    text,
                    source_doc=source_doc,
                    max_concepts=max_concepts,
                    conversation_excerpt=conversation_excerpt,
                    topic_hint=topic_hint,
                )
            except Exception as e:
                print(f"⚠️ ConceptExtractor LLM falló: {e}")
                # No devolver heurística basura de Title Case / filename
                raise

        return self._extract_heuristic(
            text or (conversation_excerpt or ""),
            source_doc=source_doc,
            max_concepts=max_concepts,
        )

    def _extract_with_llm(
        self,
        text: str,
        *,
        source_doc: Optional[str],
        max_concepts: int,
        conversation_excerpt: Optional[str] = None,
        topic_hint: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        material = text[:10000] if text else "(sin extractos de documento)"
        chat_ctx = (conversation_excerpt or "").strip()[:4000]
        topic_line = (topic_hint or "").strip()
        source_line = source_doc or "(desconocido)"

        prompt = f"""Eres un experto en ciencia del aprendizaje. Extrae los CONCEPTOS CLAVE que el alumno debe dominar.

## Tema del chat (si hay)
{topic_line or "(no especificado)"}

## Nombre del archivo (IGNORAR como fuente de conceptos; no es contenido)
{source_line}

## Conversación reciente (qué se está explicando de verdad)
\"\"\"
{chat_ctx or "(sin mensajes aún)"}
\"\"\"

## Extractos del material / PDF (contenido real; ignora portada, índice, metadatos, pies de página)
\"\"\"
{material}
\"\"\"

Devuelve SOLO un JSON válido (sin markdown) con esta forma:
{{
  "concepts": [
    {{
      "name": "nombre corto del micro-concepto",
      "description": "1 frase que diga QUÉ es / por qué importa en este material",
      "prerequisites": ["nombre de otro concepto de esta lista"]
    }}
  ]
}}

Reglas ESTRICTAS:
- Entre 8 y {max_concepts} conceptos (micro, aprendibles; no temas vagos).
- Prioriza lo que se EXPLICA en el PDF y lo que sale en la conversación.
- PROHIBIDO: palabras sueltas del título/filename, TOC, "Capítulo 1", nombres de asignatura, autores, números de página.
- PROHIBIDO: conceptos que solo sean capitalizaciones sin definición en el material.
- Si el material es técnico (p.ej. React), usa términos reales (hooks, JSX, props…), no ruido tipográfico.
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
        normalized = self._normalize(items, source_doc=source_doc, max_concepts=max_concepts)
        # Filtrar basura tipo filename
        junk = self._junk_tokens(source_doc)
        filtered = [
            c for c in normalized
            if c["name"].lower() not in junk
            and len(c["name"].split()) <= 6
            and c["name"].lower() not in _STOP_PHRASES
        ]
        return filtered[:max_concepts]

    def _junk_tokens(self, source_doc: Optional[str]) -> set:
        if not source_doc:
            return set()
        base = re.sub(r"\.[a-zA-Z0-9]+$", "", source_doc)
        parts = re.split(r"[\s_\-\.]+", base.lower())
        return {p for p in parts if len(p) > 2}

    def _extract_heuristic(
        self,
        text: str,
        *,
        source_doc: Optional[str],
        max_concepts: int,
    ) -> List[Dict[str, Any]]:
        """Fallback sin LLM: solo headings claros; nunca Title Case suelto."""
        candidates: List[str] = []
        junk = self._junk_tokens(source_doc)
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.match(r"^#{1,3}\s+\S", line) or re.match(r"^\d+[\.\)]\s+\S", line):
                cleaned = re.sub(r"^[#\d\.\)\s]+", "", line)
                cleaned = cleaned.strip(" -:•")
                if 3 < len(cleaned) < 80 and cleaned.lower() not in junk:
                    if cleaned.lower() not in _STOP_PHRASES:
                        candidates.append(cleaned)

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

        items = [
            {"name": n, "description": f"Concepto detectado en el material: {n}", "prerequisites": []}
            for n in unique
        ]
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
