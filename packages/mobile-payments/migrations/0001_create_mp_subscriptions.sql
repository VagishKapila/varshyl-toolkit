-- Migration: 0001_create_mp_subscriptions
-- Current subscription state per org (one row per org).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS mp_subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              TEXT        NOT NULL UNIQUE,
  product_slug        TEXT        NOT NULL,
  status              TEXT        NOT NULL CHECK (status IN ('trial', 'active', 'lapsed', 'none')),
  seats               INTEGER     NOT NULL DEFAULT 1,
  store               TEXT        CHECK (store IN ('apple', 'google', 'stripe')),
  current_period_end  TIMESTAMPTZ NULL,
  trial_ends_at       TIMESTAMPTZ NULL,
  rc_app_user_id      TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_subscriptions_status ON mp_subscriptions (status);
