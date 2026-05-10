CREATE TABLE IF NOT EXISTS tm_organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id INTEGER NOT NULL,  -- denormalized for quick lookup
  settings JSONB NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  delete_scheduled_for TIMESTAMPTZ,
  deleted_by_user_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_orgs_slug ON tm_organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tm_orgs_owner ON tm_organizations(owner_user_id);
