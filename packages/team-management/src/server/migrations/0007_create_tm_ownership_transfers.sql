DO $$ BEGIN
  CREATE TYPE tm_transfer_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tm_ownership_transfers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES tm_organizations(id) ON DELETE CASCADE,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  status tm_transfer_status NOT NULL DEFAULT 'pending',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by_user_id INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,  -- NOW() + 7 days
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Only one pending transfer per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_transfers_pending ON tm_ownership_transfers(org_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tm_transfers_org ON tm_ownership_transfers(org_id);
