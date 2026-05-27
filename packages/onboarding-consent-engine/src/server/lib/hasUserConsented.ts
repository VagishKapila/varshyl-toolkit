import type { Pool } from 'pg';

export async function hasUserConsented(
  pool: Pool,
  userId: string,
  key: string,
): Promise<boolean> {
  const result = await pool.query<{ granted: boolean }>(
    `SELECT uc.granted
     FROM oce_user_consents uc
     JOIN oce_consent_definitions cd ON cd.id = uc.definition_id
     WHERE uc.user_id = $1 AND cd.key = $2
     ORDER BY uc.consented_at DESC
     LIMIT 1`,
    [userId, key],
  );
  return result.rows.length > 0 && result.rows[0].granted === true;
}
