import type { Pool } from 'pg';
import { runMigrations, type RunMigrationsOptions } from './migrations.js';
import { seedStandardConsents } from './seed.js';
import { withOceTimeout } from './timeout.js';
import { OceError } from './errors.js';
import {
  DEFAULT_OCE_CONNECTION_TIMEOUT_MS,
  DEFAULT_OCE_OPERATION_TIMEOUT_MS,
} from './pool.js';
import { STANDARD_CONSENTS } from './templates/index.js';

export interface OceSelfTestResult {
  migrationsOk: boolean;
  seedOk: boolean;
  consentKeysFound: string[];
}

export interface OceSelfTestOptions extends RunMigrationsOptions {
  pool: Pool;
  productName?: string;
  /** Per-operation timeout for seed/read checks (default 5000ms). */
  timeoutMs?: number;
}

/**
 * Boot-time wiring check: apply migrations, seed standard consents, verify keys exist.
 * Throws OceError on failure — never hangs (timeouts enforced).
 */
export async function oceSelfTest(opts: OceSelfTestOptions): Promise<OceSelfTestResult> {
  const connectionTimeoutMs = opts.connectionTimeoutMs ?? DEFAULT_OCE_CONNECTION_TIMEOUT_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_OCE_OPERATION_TIMEOUT_MS;
  const productName = opts.productName ?? 'SelfTest';

  try {
    await runMigrations(opts.pool, undefined, { connectionTimeoutMs });
  } catch (error) {
    if (error instanceof OceError) {
      throw error;
    }
    throw new OceError(
      error instanceof Error ? error.message : 'Migrations failed',
      'OCE_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  try {
    await withOceTimeout(seedStandardConsents(opts.pool, productName), timeoutMs);
  } catch (error) {
    if (error instanceof OceError) {
      throw error;
    }
    throw new OceError(
      error instanceof Error ? error.message : 'Seed failed',
      'OCE_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  const keysResult = await withOceTimeout(
    opts.pool.query<{ key: string }>('SELECT key FROM oce_consent_definitions ORDER BY key'),
    timeoutMs,
  );
  const consentKeysFound = keysResult.rows.map((row) => row.key);
  const expectedKeys = STANDARD_CONSENTS.map((c) => c.key);
  const missing = expectedKeys.filter((key) => !consentKeysFound.includes(key));
  if (missing.length > 0) {
    throw new OceError(
      `Missing consent definitions after seed: ${missing.join(', ')}`,
      'OCE_MIGRATIONS_FAILED',
    );
  }

  return {
    migrationsOk: true,
    seedOk: true,
    consentKeysFound,
  };
}
