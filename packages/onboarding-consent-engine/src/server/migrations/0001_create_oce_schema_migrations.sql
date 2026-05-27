-- Migration ledger for @varshyl/onboarding-consent-engine
CREATE TABLE IF NOT EXISTS oce_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oce_schema_migrations_migration ON oce_schema_migrations (migration);
