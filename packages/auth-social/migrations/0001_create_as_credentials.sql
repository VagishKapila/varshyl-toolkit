-- Migration: 0001_create_as_credentials
-- Email + password credentials keyed to host user id.

CREATE TABLE IF NOT EXISTS as_credentials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  email         CITEXT      NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_as_credentials_user_id ON as_credentials (user_id);
