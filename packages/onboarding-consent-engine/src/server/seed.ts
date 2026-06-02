import type { Pool } from 'pg';
import { STANDARD_CONSENTS, applyProductName } from './templates/index.js';

/**
 * Upsert standard consent definitions into oce_consent_definitions.
 * Idempotent — safe to call on every server start.
 */
export async function seedStandardConsents(db: Pool, productName: string): Promise<void> {
  for (const consent of STANDARD_CONSENTS) {
    const displayText = applyProductName(consent.display_text, productName);
    await db.query(
      `INSERT INTO oce_consent_definitions (key, required, display_text, legal_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO NOTHING`,
      [consent.key, consent.required, displayText, consent.legal_url],
    );
  }
}
