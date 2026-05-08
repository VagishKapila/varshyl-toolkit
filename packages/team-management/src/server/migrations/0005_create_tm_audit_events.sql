CREATE TABLE IF NOT EXISTS tm_audit_events (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES tm_organizations(id) ON DELETE SET NULL,
  actor_user_id INTEGER,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'super_admin')),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ip TEXT,
  user_agent TEXT,
  reason TEXT,  -- required for super_admin actions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tm_audit_org ON tm_audit_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tm_audit_actor ON tm_audit_events(actor_user_id);
