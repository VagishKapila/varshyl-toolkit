CREATE TABLE IF NOT EXISTS tm_invitations (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES tm_organizations(id) ON DELETE CASCADE,
  invited_by_user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  role tm_role NOT NULL DEFAULT 'member',
  token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of the magic-link token
  code_encrypted TEXT NOT NULL,      -- AES-256-GCM encrypted 6-digit code
  expires_at TIMESTAMPTZ NOT NULL,   -- NOW() + 7 days
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id INTEGER,
  resent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Only one pending invite per email per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_tm_invitations_pending ON tm_invitations(org_id, email) WHERE accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_tm_invitations_org ON tm_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_tm_invitations_email ON tm_invitations(email);
