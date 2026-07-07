-- Migration: 0001_create_sc_credit_tables
-- Soren Credits (M4) — account balance + transaction ledger

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sc_credit_accounts (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email       TEXT        NOT NULL UNIQUE,
  balance     INTEGER     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sc_credit_transactions (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  account_id        TEXT        NOT NULL REFERENCES sc_credit_accounts(id),
  amount            INTEGER     NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('purchase', 'deduct')),
  description       TEXT        NOT NULL,
  stripe_session_id TEXT        NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_credit_transactions_account_id
  ON sc_credit_transactions (account_id);

CREATE INDEX IF NOT EXISTS idx_sc_credit_transactions_stripe_session_id
  ON sc_credit_transactions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sc_credit_transactions_stripe_session_id
  ON sc_credit_transactions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
