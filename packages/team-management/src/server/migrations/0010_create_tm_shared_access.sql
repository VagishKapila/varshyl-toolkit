-- tm_shared_access: reserved for v0.2.0 (cross-org vendor access).
-- Empty scaffold -- no columns beyond id. Do not add anything here in v0.1.0.
CREATE TABLE IF NOT EXISTS tm_shared_access (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NOTE: This table is intentionally empty in v0.1.0.
-- Schema will be defined in the v0.2.0 migration.
