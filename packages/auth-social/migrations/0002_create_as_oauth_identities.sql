-- Migration: 0002_create_as_oauth_identities
-- Social provider links (Apple / Google).

CREATE TABLE IF NOT EXISTS as_oauth_identities (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL,
  provider         TEXT        NOT NULL CHECK (provider IN ('apple', 'google')),
  provider_subject TEXT        NOT NULL,
  email            CITEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_as_oauth_identities_user_id ON as_oauth_identities (user_id);
