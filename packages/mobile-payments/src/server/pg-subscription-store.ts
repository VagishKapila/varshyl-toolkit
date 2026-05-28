import type { Pool } from 'pg';
import type { PaymentsConfig } from '../config.js';
import type {
  AppendEventInput,
  SeatAssignment,
  SubscriptionRecord,
  SubscriptionStatus,
  SubscriptionStoreType,
  UpsertSubscriptionInput,
} from '../types.js';
import type { SubscriptionStore } from './store.js';

function rowToRecord(row: Record<string, unknown>): SubscriptionRecord {
  return {
    orgId: String(row.org_id),
    productSlug: String(row.product_slug),
    status: row.status as SubscriptionStatus,
    seats: Number(row.seats),
    store: (row.store as SubscriptionStoreType | null) ?? null,
    currentPeriodEnd: row.current_period_end
      ? new Date(String(row.current_period_end)).toISOString()
      : null,
    trialEndsAt: row.trial_ends_at
      ? new Date(String(row.trial_ends_at)).toISOString()
      : null,
    rcAppUserId: row.rc_app_user_id ? String(row.rc_app_user_id) : null,
  };
}

export function createPgSubscriptionStore(
  pool: Pool,
  _config: PaymentsConfig
): SubscriptionStore {
  return {
    async getSubscription(orgId) {
      const result = await pool.query(
        `SELECT * FROM mp_subscriptions WHERE org_id = $1`,
        [orgId]
      );
      return result.rows[0] ? rowToRecord(result.rows[0]) : null;
    },

    async upsertSubscription(input: UpsertSubscriptionInput) {
      const result = await pool.query(
        `INSERT INTO mp_subscriptions (
          org_id, product_slug, status, seats, store,
          current_period_end, trial_ends_at, rc_app_user_id, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (org_id) DO UPDATE SET
          product_slug = EXCLUDED.product_slug,
          status = EXCLUDED.status,
          seats = COALESCE(EXCLUDED.seats, mp_subscriptions.seats),
          store = EXCLUDED.store,
          current_period_end = EXCLUDED.current_period_end,
          trial_ends_at = EXCLUDED.trial_ends_at,
          rc_app_user_id = EXCLUDED.rc_app_user_id,
          updated_at = NOW()
        RETURNING *`,
        [
          input.orgId,
          input.productSlug,
          input.status,
          input.seats ?? 1,
          input.store ?? null,
          input.currentPeriodEnd ?? null,
          input.trialEndsAt ?? null,
          input.rcAppUserId ?? input.orgId,
        ]
      );
      return rowToRecord(result.rows[0]);
    },

    async appendEvent(input: AppendEventInput) {
      await pool.query(
        `INSERT INTO mp_subscription_events (
          org_id, product_slug, event_type, amount, currency, status, occurred_at, raw
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          input.orgId,
          input.productSlug,
          input.eventType,
          input.amount ?? null,
          input.currency ?? null,
          input.status,
          input.occurredAt ?? new Date().toISOString(),
          input.raw ? JSON.stringify(input.raw) : null,
        ]
      );
    },

    async assignSeat(orgId, userId, assignedBy = null) {
      await pool.query(
        `INSERT INTO mp_seat_assignments (org_id, user_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (org_id, user_id) DO NOTHING`,
        [orgId, userId, assignedBy]
      );
    },

    async removeSeat(orgId, userId) {
      await pool.query(
        `DELETE FROM mp_seat_assignments WHERE org_id = $1 AND user_id = $2`,
        [orgId, userId]
      );
    },

    async hasSeat(orgId, userId) {
      const result = await pool.query(
        `SELECT 1 FROM mp_seat_assignments WHERE org_id = $1 AND user_id = $2`,
        [orgId, userId]
      );
      return result.rows.length > 0;
    },

    async listSeats(orgId) {
      const result = await pool.query(
        `SELECT org_id, user_id, assigned_at, assigned_by
         FROM mp_seat_assignments WHERE org_id = $1 ORDER BY assigned_at`,
        [orgId]
      );
      return result.rows.map((row): SeatAssignment => ({
        orgId: String(row.org_id),
        userId: String(row.user_id),
        assignedAt: new Date(String(row.assigned_at)).toISOString(),
        assignedBy: row.assigned_by ? String(row.assigned_by) : null,
      }));
    },
  };
}
