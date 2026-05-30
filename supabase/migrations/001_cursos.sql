-- Curso de React: perfiles, tokens de alumno, progreso y diplomas

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL DEFAULT 'react',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_tokens_user_course
  ON student_tokens(user_id, course_slug)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS level_progress (
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL DEFAULT 'react',
  level_id INTEGER NOT NULL,
  completed_checkpoints JSONB NOT NULL DEFAULT '{}'::jsonb,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  passed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, course_slug, level_id)
);

CREATE TABLE IF NOT EXISTS diplomas (
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL DEFAULT 'react',
  name_on_diploma TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, course_slug)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas ENABLE ROW LEVEL SECURITY;

-- Políticas defensivas (acceso real vía service role en API)
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY level_progress_select_own ON level_progress
  FOR SELECT USING (auth.uid()::text = user_id);
