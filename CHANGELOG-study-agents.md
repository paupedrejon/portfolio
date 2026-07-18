# Changelog — Study Agents

## 0.3.7 — Modales SA + apuntes leen el PDF de verdad

### Visible
- Modales Plan / Conceptos / Repaso con shell unificado (`SaModal`): bot animado, `#2596be`, pills, blur

### Fix crítico
- Apuntes ya no usan el **nombre del PDF** como tema y inventan contenido: priorizan el **corpus RAG del chat**
- Proxy `generate-notes` no fuerza `topics=[archivo.pdf]`

### Backend
- Redeploy Railway obligatorio (`explanation_agent.py`)

## 0.3.6 — Parpadeo fijado + plan adaptativo (F1.4) + extracción F0.1

### Visible
- Bot: parpadeo SMIL centrado (ya no baja los ojos con `scaleY`)
- Tras corregir un test: aviso para **regenerar el Plan** con los gaps nuevos
- `SuccessMessage` extraído de `StudyChat` → `chat/SuccessMessage.tsx`

### Pedagogía
- `generate-study-plan` inyecta mastery + gaps prioritarios en el prompt (secuenciación adaptativa)

### Backend
- Redeploy Railway requerido (`explanation_agent.py`)

## 0.3.5 — Bot cute animado (avatar de marca)

### Visible
- Avatar SVG del robot Study Agents con **parpadeo**, flotación y modo thinking (glow + antenas)
- Color de marca `#2596be` (claro) / `#7dd3fc` (oscuro)
- En mensajes del asistente, loading, hero y nav

## 0.3.4 — F1.5 dificultad adaptativa + ejercicios en el grafo

### Pedagogía
- `target_difficulty` desde mastery (zona de desarrollo próximo) en `generate-test` y `generate-exercise`
- Foco automático en micro-conceptos débiles / ZPD
- Ejercicios con `concept_ids`; `correct-exercise` actualiza mastery BKT + crea tarjetas SRS
- Tras fallo de ejercicio: sugiere prerrequisito débil si existe
- **ConceptMapPanel**: sección Gaps prioritarios vía `detect-gaps`

### Qué probar
1. Extraer conceptos → generar test/ejercicio (dificultad debería adaptarse al dominio)
2. Fallar un ejercicio → ver mastery/gaps y aviso de repaso
3. Abrir Conceptos → bloque "Gaps prioritarios"

### Backend
- Redeploy Railway requerido (`mastery.py`, `main.py`, `exercise_generator.py`)

## 0.3.3 — BYOK multi-proveedor + RAG PDF + QuickActions

- OpenAI opcional (basta Groq/DeepSeek/OpenRouter)
- Tema General ya no ignora PDFs indexados
- QuickActions con iconos SA

## 0.3.2 — Modelos chinos/gratis + sin emojis UI

### Modelos
- Selector ampliado: DeepSeek, Qwen/GLM (OpenRouter free), Groq (Llama/Gemma), Ollama, OpenAI
- Keys opcionales: DeepSeek, Groq, OpenRouter (además de OpenAI para RAG)
- `ModelManager` multi-proveedor (OpenAI-compatible base_url)

### UI
- Emojis de mensajes/modales sustituidos por texto o iconos SVG

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
