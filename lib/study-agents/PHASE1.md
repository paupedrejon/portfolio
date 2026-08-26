# Study Agents — Fase 1 (planes Free / Premium)

## Qué hay
- Tablas Supabase: `sa_users`, `sa_subscriptions`, `sa_usage_daily` (`supabase/migrations/004_study_agents.sql`)
- **Free**: LLM vía `GROQ_API_KEY` del servidor (no se envía al navegador), cuota diaria
- **Premium**: BYOK (keys en localStorage) como hasta ahora
- Stripe subscription: estructura en DB; cobro live más adelante

## Env
```bash
GROQ_API_KEY=gsk_...
STUDY_AGENTS_FREE_DAILY_REQUESTS=40   # opcional, default 40
STUDY_AGENTS_PREMIUM_USER_IDS=id1,id2 # opcional, premium de prueba sin Stripe
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Aplicar migración
En el SQL editor de Supabase, ejecuta el contenido de `004_study_agents.sql`.

## Flujo
1. Login Google → upsert `sa_users` + `sa_subscriptions` (plan `free`)
2. BFF (`llm-gateway`) mira el plan y:
   - Free → inyecta Groq servidor + cuenta uso
   - Premium → exige keys del cliente
3. UI muestra badge Free/Premium y restantes diarios
