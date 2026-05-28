-- Migration: 0003_create_mp_seat_assignments
-- Maps org seats to user ids (one row per occupied seat).

CREATE TABLE IF NOT EXISTS mp_seat_assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      TEXT        NOT NULL,
  user_id     TEXT        NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by TEXT        NULL,
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_seat_assignments_org_id ON mp_seat_assignments (org_id);
CREATE INDEX IF NOT EXISTS idx_mp_seat_assignments_user_id ON mp_seat_assignments (user_id);
