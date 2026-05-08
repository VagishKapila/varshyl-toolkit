CREATE TABLE IF NOT EXISTS tm_super_admins (
  user_id INTEGER PRIMARY KEY,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by_user_id INTEGER,
  notes TEXT,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tm_super_admins_active ON tm_super_admins(user_id) WHERE revoked_at IS NULL;
