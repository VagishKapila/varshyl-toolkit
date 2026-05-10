CREATE TABLE IF NOT EXISTS tm_password_reset_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 of reset token
  expires_at TIMESTAMPTZ NOT NULL,  -- NOW() + 1 hour
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tm_pwd_reset_user ON tm_password_reset_requests(user_id, created_at DESC);
