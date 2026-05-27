import type { Pool } from 'pg';
import type { RecordConsentInput, UserConsent } from '../../shared/types.js';

export async function recordConsent(pool: Pool, input: RecordConsentInput): Promise<UserConsent> {
  const { userId, definitionId, version, granted, ipAddress, userAgent } = input;
  const result = await pool.query<UserConsent>(
    `INSERT INTO oce_user_consents (user_id, definition_id, version, granted, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, definitionId, version, granted, ipAddress ?? null, userAgent ?? null],
  );
  return result.rows[0];
}
