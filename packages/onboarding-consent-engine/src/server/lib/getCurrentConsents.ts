import type { Pool } from 'pg';
import type { ConsentStatus } from '../../shared/types.js';

/**
 * Returns the latest consent status for every definition the user has
 * interacted with (both granted and revoked).
 */
export async function getCurrentConsents(
  pool: Pool,
  userId: string,
): Promise<ConsentStatus[]> {
  const result = await pool.query<ConsentStatus>(
    `SELECT cd.key, cd.version, uc.granted, uc.consented_at
     FROM oce_consent_definitions cd
     JOIN LATERAL (
       SELECT granted, consented_at
       FROM oce_user_consents
       WHERE user_id = $1 AND definition_id = cd.id
       ORDER BY consented_at DESC
       LIMIT 1
     ) uc ON true`,
    [userId],
  );
  return result.rows;
}
