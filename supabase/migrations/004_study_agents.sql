-- Study Agents Phase 1: usuarios, plan Free/Premium y uso diario
-- Aplicar en Supabase SQL editor o CLI. Acceso vía service role (Next.js).

CREATE TABLE IF NOT EXISTS sa_users (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sa_subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES sa_users(user_id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'premium')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sa_usage_daily (
  user_id TEXT NOT NULL REFERENCES sa_users(user_id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (CURRENT_DATE),
  requests INT NOT NULL DEFAULT 0,
  tokens_in INT NOT NULL DEFAULT 0,
  tokens_out INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_sa_subscriptions_plan
  ON sa_subscriptions(plan);

CREATE INDEX IF NOT EXISTS idx_sa_usage_daily_day
  ON sa_usage_daily(day);

ALTER TABLE sa_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_usage_daily ENABLE ROW LEVEL SECURITY;

-- Políticas defensivas (el acceso real es service role desde la API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sa_users' AND policyname = 'sa_users_select_own'
  ) THEN
    CREATE POLICY sa_users_select_own ON sa_users
      FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sa_subscriptions' AND policyname = 'sa_subscriptions_select_own'
  ) THEN
    CREATE POLICY sa_subscriptions_select_own ON sa_subscriptions
      FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sa_usage_daily' AND policyname = 'sa_usage_daily_select_own'
  ) THEN
    CREATE POLICY sa_usage_daily_select_own ON sa_usage_daily
      FOR SELECT USING (auth.uid()::text = user_id);
  END IF;
END $$;
