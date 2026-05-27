import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import type { Pool } from 'pg';
import type {
  ConsentModule,
  ConsentModuleConfig,
} from '../shared/types.js';
import {
  recordConsent,
  recordSignupConsents,
  hasUserConsented,
  needsConsentUpdate,
  getCurrentConsents,
  getAuditTrail,
  getUserLatestConsents,
} from './lib/index.js';
import { STANDARD_CONSENTS, applyProductName } from './templates/index.js';

const migrationsDir = join(fileURLToPath(new URL('.', import.meta.url)), 'migrations');

const MIGRATIONS: Array<{ name: string; file: string }> = [
  {
    name: '0001_create_oce_schema_migrations',
    file: join(migrationsDir, '0001_create_oce_schema_migrations.sql'),
  },
  {
    name: '0002_create_oce_consent_definitions',
    file: join(migrationsDir, '0002_create_oce_consent_definitions.sql'),
  },
  {
    name: '0003_create_oce_user_consents',
    file: join(migrationsDir, '0003_create_oce_user_consents.sql'),
  },
  {
    name: '0004_create_oce_consent_version_log',
    file: join(migrationsDir, '0004_create_oce_consent_version_log.sql'),
  },
];

export async function runMigrations(
  db: Pool,
  logger: { info(msg: string): void } = { info: () => {} },
): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = [];
  const skipped: string[] = [];

  // Bootstrap the ledger table first (idempotent)
  const ledgerSql = readFileSync(
    join(migrationsDir, '0001_create_oce_schema_migrations.sql'),
    'utf-8',
  );
  await db.query(ledgerSql);

  for (const migration of MIGRATIONS) {
    const result = await db.query(
      'SELECT id FROM oce_schema_migrations WHERE migration = $1',
      [migration.name],
    );
    if (result.rows.length > 0) {
      skipped.push(migration.name);
      continue;
    }
    const sql = readFileSync(migration.file, 'utf-8');
    await db.query(sql);
    await db.query('INSERT INTO oce_schema_migrations (migration) VALUES ($1)', [migration.name]);
    logger.info(`[oce] applied migration: ${migration.name}`);
    applied.push(migration.name);
  }

  return { applied, skipped };
}

/**
 * Upsert standard consent definitions into oce_consent_definitions.
 * Idempotent — safe to call on every server start.
 * productName is applied to display_text at this point; components display
 * the stored text verbatim and never interpolate at render time.
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

export function createConsentModule(config: ConsentModuleConfig): ConsentModule {
  const { pool, adapter } = config;

  const notify = async (userId: string, key: string, granted: boolean) => {
    if (adapter?.onConsentRecorded) {
      await adapter.onConsentRecorded(userId, key, granted);
    }
  };

  return {
    async recordConsent(input) {
      const record = await recordConsent(pool, input);
      const keyResult = await pool.query<{ key: string }>(
        'SELECT key FROM oce_consent_definitions WHERE id = $1',
        [input.definitionId],
      );
      if (keyResult.rows.length > 0) {
        await notify(input.userId, keyResult.rows[0].key, input.granted);
      }
      return record;
    },

    async recordSignupConsents(input) {
      const records = await recordSignupConsents(pool, input);
      for (const c of input.consents) {
        await notify(input.userId, c.key, c.granted);
      }
      return records;
    },

    hasUserConsented: (userId, key) => hasUserConsented(pool, userId, key),
    needsConsentUpdate: (userId) => needsConsentUpdate(pool, userId),
    getCurrentConsents: (userId) => getCurrentConsents(pool, userId),
    getAuditTrail: (userId, limit) => getAuditTrail(pool, userId, limit),
    getUserLatestConsents: (userIds) => getUserLatestConsents(pool, userIds),
  };
}

// Re-export types and template helpers for convenience
export type {
  ConsentDefinition,
  UserConsent,
  ConsentVersionLog,
  RecordConsentInput,
  RecordSignupConsentsInput,
  ConsentStatus,
  AuditEntry,
  ConsentModuleAdapter,
  ConsentModuleConfig,
  ConsentModule,
} from '../shared/types.js';
export { STANDARD_CONSENTS, applyProductName } from './templates/index.js';
