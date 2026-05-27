-- Consent definitions: one row per consent type, versioned
CREATE TABLE IF NOT EXISTS oce_consent_definitions (
  id           SERIAL       PRIMARY KEY,
  key          VARCHAR(128) NOT NULL UNIQUE,
  version      INTEGER      NOT NULL DEFAULT 1,
  required     BOOLEAN      NOT NULL DEFAULT false,
  display_text TEXT         NOT NULL,
  legal_url    TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_oce_consent_definitions_key ON oce_consent_definitions (key);
