-- Migration: 0001_create_nt_device_tokens
-- Platform-agnostic device token registry for FCM/APNs push delivery.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS nt_device_tokens (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT        NOT NULL,
  org_id                TEXT        NOT NULL,
  token                 TEXT        NOT NULL,
  platform              TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
  announcements_opt_in  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_nt_device_tokens_org_user
  ON nt_device_tokens (org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_nt_device_tokens_token
  ON nt_device_tokens (token);

CREATE INDEX IF NOT EXISTS idx_nt_device_tokens_announcements_opt_in
  ON nt_device_tokens (announcements_opt_in)
  WHERE announcements_opt_in = TRUE;
