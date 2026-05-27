-- Immutable append-only consent records per user
-- user_id is TEXT — no FK, format determined by consuming product
CREATE TABLE IF NOT EXISTS oce_user_consents (
  id            SERIAL       PRIMARY KEY,
  user_id       TEXT         NOT NULL,
  definition_id INTEGER      NOT NULL REFERENCES oce_consent_definitions(id),
  version       INTEGER      NOT NULL,
  granted       BOOLEAN      NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  consented_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oce_user_consents_user_id ON oce_user_consents (user_id);
CREATE INDEX IF NOT EXISTS idx_oce_user_consents_definition_id ON oce_user_consents (definition_id);
