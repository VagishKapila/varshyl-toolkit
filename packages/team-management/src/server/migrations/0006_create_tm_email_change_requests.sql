CREATE TABLE IF NOT EXISTS tm_email_change_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  old_email TEXT NOT NULL,
  new_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 of verification token
  expires_at TIMESTAMPTZ NOT NULL,  -- NOW() + 24 hours
  verified_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tm_email_change_user ON tm_email_change_requests(user_id, created_at DESC);
