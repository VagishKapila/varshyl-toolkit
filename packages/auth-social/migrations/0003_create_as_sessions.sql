-- Migration: 0003_create_as_sessions
-- Opaque, revocable session tokens (hash stored, raw returned once).

CREATE TABLE IF NOT EXISTS as_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_as_sessions_token_hash ON as_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_as_sessions_user_id ON as_sessions (user_id);
