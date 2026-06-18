import type { Pool } from 'pg';
import type {
  DeviceToken,
  DeviceTokenStore,
  EligibleTokenFilter,
  RegisterDeviceTokenInput,
  UnregisterDeviceTokenInput,
} from '../types.js';

interface TokenRow {
  user_id: string;
  org_id: string;
  platform: 'ios' | 'android';
  token: string;
  announcements_opt_in: boolean;
  created_at: Date;
}

function mapRow(row: TokenRow): DeviceToken {
  return {
    userId: String(row.user_id),
    orgId: String(row.org_id),
    platform: row.platform,
    token: String(row.token),
    announcementsOptIn: Boolean(row.announcements_opt_in),
    createdAt: new Date(row.created_at),
  };
}

export function createPgDeviceTokenStore(pool: Pool): DeviceTokenStore {
  return {
    async register(input: RegisterDeviceTokenInput): Promise<void> {
      const announcementsOptIn = input.announcementsOptIn ?? true;
      await pool.query(
        `INSERT INTO nt_device_tokens (user_id, org_id, token, platform, announcements_opt_in)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, token) DO UPDATE SET
           org_id = EXCLUDED.org_id,
           platform = EXCLUDED.platform,
           announcements_opt_in = EXCLUDED.announcements_opt_in,
           updated_at = NOW()`,
        [input.userId, input.orgId, input.token, input.platform, announcementsOptIn],
      );
    },

    async unregister(input: UnregisterDeviceTokenInput): Promise<void> {
      await pool.query(
        `DELETE FROM nt_device_tokens
         WHERE user_id = $1 AND org_id = $2 AND token = $3`,
        [input.userId, input.orgId, input.token],
      );
    },

    async listEligible(filter: EligibleTokenFilter = {}): Promise<DeviceToken[]> {
      const clauses: string[] = [];
      const params: unknown[] = [];

      if (filter.orgId !== undefined) {
        params.push(filter.orgId);
        clauses.push(`org_id = $${params.length}`);
      }
      if (filter.userId !== undefined) {
        params.push(filter.userId);
        clauses.push(`user_id = $${params.length}`);
      }
      if (filter.platform !== undefined) {
        params.push(filter.platform);
        clauses.push(`platform = $${params.length}`);
      }
      if (filter.announcementsOptIn !== undefined) {
        params.push(filter.announcementsOptIn);
        clauses.push(`announcements_opt_in = $${params.length}`);
      }

      const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const { rows } = await pool.query<TokenRow>(
        `SELECT user_id, org_id, platform, token, announcements_opt_in, created_at
         FROM nt_device_tokens
         ${where}
         ORDER BY created_at DESC`,
        params,
      );
      return rows.map(mapRow);
    },

    async tokensForUser(userId: string, orgId: string): Promise<string[]> {
      const { rows } = await pool.query<{ token: string }>(
        `SELECT token FROM nt_device_tokens WHERE user_id = $1 AND org_id = $2`,
        [userId, orgId],
      );
      return rows.map((r) => String(r.token));
    },

    async removeTokens(tokens: string[]): Promise<void> {
      if (tokens.length === 0) return;
      await pool.query(`DELETE FROM nt_device_tokens WHERE token = ANY($1::text[])`, [tokens]);
    },
  };
}

/** Query tokens by opt-in flags — convenience wrapper for Hub broadcast audience. */
export async function listEligibleTokens(
  pool: Pool,
  filter: EligibleTokenFilter = {},
): Promise<DeviceToken[]> {
  return createPgDeviceTokenStore(pool).listEligible(filter);
}

export async function registerDeviceToken(
  pool: Pool,
  input: RegisterDeviceTokenInput,
): Promise<void> {
  await createPgDeviceTokenStore(pool).register(input);
}

export async function unregisterDeviceToken(
  pool: Pool,
  input: UnregisterDeviceTokenInput,
): Promise<void> {
  await createPgDeviceTokenStore(pool).unregister(input);
}
