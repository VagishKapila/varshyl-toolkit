import type { Pool } from 'pg';
import type { ConsentStatus } from '../../shared/types.js';

export async function getUserLatestConsents(
  pool: Pool,
  userIds: string[],
): Promise<Map<string, ConsentStatus[]>> {
  if (userIds.length === 0) return new Map();

  const result = await pool.query<ConsentStatus & { user_id: string }>(
    `SELECT DISTINCT ON (uc.user_id, cd.key)
       uc.user_id, cd.key, uc.version, uc.granted, uc.consented_at
     FROM oce_user_consents uc
     JOIN oce_consent_definitions cd ON cd.id = uc.definition_id
     WHERE uc.user_id = ANY($1::text[])
     ORDER BY uc.user_id, cd.key, uc.consented_at DESC`,
    [userIds],
  );

  const map = new Map<string, ConsentStatus[]>();
  for (const row of result.rows) {
    const { user_id, ...status } = row;
    if (!map.has(user_id)) map.set(user_id, []);
    map.get(user_id)!.push(status);
  }
  return map;
}
