-- Migration: 0004_create_as_password_resets
-- Single-use password reset tokens.

CREATE TABLE IF NOT EXISTS as_password_resets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_password_resets_token_hash ON as_password_resets (token_hash);
