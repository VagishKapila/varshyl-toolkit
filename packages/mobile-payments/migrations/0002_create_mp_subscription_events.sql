-- Migration: 0002_create_mp_subscription_events
-- Append-only subscription event ledger.

CREATE TABLE IF NOT EXISTS mp_subscription_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        TEXT        NOT NULL,
  product_slug  TEXT        NOT NULL,
  event_type    TEXT        NOT NULL,
  amount        NUMERIC     NULL,
  currency      TEXT        NULL,
  status        TEXT        NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL,
  raw           JSONB       NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_subscription_events_org_id ON mp_subscription_events (org_id);
CREATE INDEX IF NOT EXISTS idx_mp_subscription_events_occurred_at ON mp_subscription_events (occurred_at DESC);
