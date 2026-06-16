CREATE TABLE mp_granted_access (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  product_slug  TEXT NOT NULL,
  granted_by    TEXT NOT NULL,
  reason        TEXT,
  expires_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_slug)
);

CREATE INDEX idx_mp_granted_access_lookup
  ON mp_granted_access(user_id, product_slug)
  WHERE revoked_at IS NULL;

CREATE TABLE mp_promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  product_slug     TEXT NOT NULL,
  max_uses         INTEGER,
  uses             INTEGER DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  grants_permanent BOOLEAN DEFAULT true,
  grants_days      INTEGER,
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  revoked_at       TIMESTAMPTZ
);

CREATE TABLE mp_promo_redemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id      UUID NOT NULL REFERENCES mp_promo_codes(id),
  user_id      TEXT NOT NULL,
  redeemed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);
