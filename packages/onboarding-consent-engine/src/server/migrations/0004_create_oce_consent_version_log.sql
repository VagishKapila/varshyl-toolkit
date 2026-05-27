-- Audit log of definition text changes (tracks consent version bumps)
CREATE TABLE IF NOT EXISTS oce_consent_version_log (
  id            SERIAL       PRIMARY KEY,
  definition_id INTEGER      NOT NULL REFERENCES oce_consent_definitions(id),
  old_version   INTEGER      NOT NULL,
  new_version   INTEGER      NOT NULL,
  old_text      TEXT         NOT NULL,
  new_text      TEXT         NOT NULL,
  changed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  changed_by    TEXT
);
CREATE INDEX IF NOT EXISTS idx_oce_consent_version_log_definition_id ON oce_consent_version_log (definition_id);
