import type { Pool } from 'pg';
import type { ConsentDefinition, RecordSignupConsentsInput, UserConsent } from '../../shared/types.js';
import { recordConsent } from './recordConsent.js';

export async function recordSignupConsents(
  pool: Pool,
  input: RecordSignupConsentsInput,
): Promise<UserConsent[]> {
  const results: UserConsent[] = [];

  for (const c of input.consents) {
    const defResult = await pool.query<ConsentDefinition>(
      'SELECT * FROM oce_consent_definitions WHERE key = $1',
      [c.key],
    );
    if (defResult.rows.length === 0) {
      throw new Error(`Unknown consent key: ${c.key}`);
    }
    const def = defResult.rows[0];
    const consent = await recordConsent(pool, {
      userId: input.userId,
      definitionId: def.id,
      version: def.version,
      granted: c.granted,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    results.push(consent);
  }

  return results;
}
