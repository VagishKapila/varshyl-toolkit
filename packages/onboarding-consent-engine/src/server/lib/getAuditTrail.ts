import type { Pool } from 'pg';
import type { AuditEntry } from '../../shared/types.js';

export async function getAuditTrail(
  pool: Pool,
  userId: string,
  limit = 50,
): Promise<AuditEntry[]> {
  const result = await pool.query<AuditEntry>(
    `SELECT uc.id, uc.user_id, cd.key, uc.version, uc.granted,
            uc.ip_address, uc.user_agent, uc.consented_at
     FROM oce_user_consents uc
     JOIN oce_consent_definitions cd ON cd.id = uc.definition_id
     WHERE uc.user_id = $1
     ORDER BY uc.consented_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return result.rows;
}
