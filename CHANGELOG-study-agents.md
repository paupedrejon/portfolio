# Changelog — Study Agents

## 0.3.1 — Fase 1 (mastery + FSRS)

### Visible
- Botón **Repaso** en toolbar (badge con pendientes) y en acciones rápidas
- **ReviewPanel**: cola FSRS con Again/Hard/Good/Easy + interleaving
- Tras fallar un test: se crean tarjetas automáticamente y aviso en el chat

### Backend (redeploy Railway)
- Tests etiquetan preguntas con `concept_ids`
- `grade-test` actualiza mastery BKT y genera tarjetas SRS
- `core/fsrs.py` + `core/card_store.py`
- Endpoints: `GET /api/srs/due`, `POST /api/srs/review`, `POST /api/srs/generate-from-errors`
- Fix: `grade_test` ahora devuelve `(feedback, usage_info)` correctamente

### Qué probar
1. Generar test → fallar alguna pregunta → corregir → aviso de tarjetas
2. Abrir **Repaso** → revelar → puntuar
3. Abrir **Conceptos** tras el test → ver dominio actualizado (si hubo extract previo)

## 0.3.0 — Fase 1 (inicio, UI visible)

### Visible en `/study-agents`
- **Barra de acciones rápidas** encima del input: Plan de estudio · Conceptos · Apuntes · Test
- Botones **Plan** y **Conceptos** en la toolbar
- **StudyPlanPanel**: genera calendario de estudio (retrieval practice) vía backend
- **ConceptMapPanel**: mapa de micro-conceptos con dominio (colores: sin evaluar / débil / en progreso / dominado)
- Hero: mensaje de diferenciación vs ChatGPT

### Backend (requiere redeploy Railway)
- `ConceptExtractorAgent` + persistencia JSON en `data/concepts/` y `data/mastery/`
- `GET /api/concepts/{chat_id}`, `POST /api/concepts/extract`
- Huérfanos implementados: `predict-mastery`, `detect-gaps`, `temporal-progress`, `save-stats`

### Qué probar en producción
1. Recarga `/study-agents` → ver botones Plan / Conceptos y la barra sobre el chat
2. Plan → crear plan de 7 días → aparece como apuntes en el chat
3. Subir PDF → Conceptos → Extraer del material → lista coloreada
4. Redeploy Railway obligatorio para extract/concepts

## 0.2.x — Fase 0 (cimientos)
- API keys, onboarding, RAG acumulativo, Docs panel, rate limit, flags, useApiClient
