-- Me gusta públicos de proyectos (requiere consentimiento de analítica en cliente)

CREATE TABLE IF NOT EXISTS project_likes (
  id BIGSERIAL PRIMARY KEY,
  project_slug TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_likes_slug_session_unique UNIQUE (project_slug, session_id)
);

CREATE INDEX IF NOT EXISTS idx_project_likes_slug
  ON project_likes (project_slug);

CREATE INDEX IF NOT EXISTS idx_project_likes_session
  ON project_likes (session_id);

ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
