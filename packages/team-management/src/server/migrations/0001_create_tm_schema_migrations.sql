-- Migration: 0001_create_tm_schema_migrations
-- Creates the ledger table that tracks which team-management
-- migrations have been applied. All tm_* tables are owned by
-- the team-management module — host products never query them directly.

CREATE TABLE IF NOT EXISTS tm_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tm_schema_migrations_migration
  ON tm_schema_migrations (migration);
