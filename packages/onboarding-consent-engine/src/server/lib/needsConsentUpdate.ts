import type { Pool } from 'pg';
import type { ConsentDefinition } from '../../shared/types.js';

/**
 * Returns required consent definitions where the user has not yet granted
 * the current version. Used to gate the app and show ConsentUpdateModal.
 */
export async function needsConsentUpdate(
  pool: Pool,
  userId: string,
): Promise<ConsentDefinition[]> {
  const result = await pool.query<ConsentDefinition>(
    `SELECT cd.*
     FROM oce_consent_definitions cd
     WHERE cd.required = true
       AND NOT EXISTS (
         SELECT 1
         FROM oce_user_consents uc
         WHERE uc.user_id = $1
           AND uc.definition_id = cd.id
           AND uc.version = cd.version
           AND uc.granted = true
       )
     ORDER BY cd.key`,
    [userId],
  );
  return result.rows;
}
