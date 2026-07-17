# Changelog — Study Agents

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
