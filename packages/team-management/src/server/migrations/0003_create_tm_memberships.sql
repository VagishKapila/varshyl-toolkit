-- If the type already exists, ignore
DO $$ BEGIN
  CREATE TYPE tm_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tm_memberships (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES tm_organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  role tm_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  removed_by_user_id INTEGER,
  removal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Only one active membership per user per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_memberships_active ON tm_memberships(org_id, user_id) WHERE removed_at IS NULL;
-- Only one owner per org (active)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_memberships_owner ON tm_memberships(org_id) WHERE role = 'owner' AND removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tm_memberships_user ON tm_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tm_memberships_org ON tm_memberships(org_id);
