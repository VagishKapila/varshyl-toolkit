import type { Pool } from 'pg';
import { runMigrations, type RunMigrationsOptions } from './migrations.js';
import { withTmTimeout } from './timeout.js';
import { TmError } from './errors.js';
import {
  DEFAULT_TM_CONNECTION_TIMEOUT_MS,
  DEFAULT_TM_OPERATION_TIMEOUT_MS,
} from './pool.js';

export interface TmSelfTestResult {
  migrationsOk: boolean;
  migrationsInLedger: number;
  organizationsTableExists: boolean;
}

export interface TmSelfTestOptions extends RunMigrationsOptions {
  pool: Pool;
  /** Per-operation timeout for verification reads (default 5000ms). */
  timeoutMs?: number;
}

/**
 * Boot-time wiring check: apply migrations and verify expected schema state.
 * Throws TmError on failure — never hangs (timeouts enforced).
 */
export async function tmSelfTest(opts: TmSelfTestOptions): Promise<TmSelfTestResult> {
  const connectionTimeoutMs = opts.connectionTimeoutMs ?? DEFAULT_TM_CONNECTION_TIMEOUT_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TM_OPERATION_TIMEOUT_MS;

  try {
    await runMigrations(opts.pool, undefined, { connectionTimeoutMs });
  } catch (error) {
    if (error instanceof TmError) {
      throw error;
    }
    throw new TmError(error instanceof Error ? error.message : 'Migrations failed', 'TM_MIGRATIONS_FAILED', {
      cause: error,
    });
  }

  const ledgerResult = await withTmTimeout(
    opts.pool.query<{ cnt: string }>('SELECT COUNT(*) AS cnt FROM tm_schema_migrations'),
    timeoutMs,
    'TM_MIGRATIONS_FAILED',
  );
  const migrationsInLedger = parseInt(ledgerResult.rows[0]?.cnt ?? '0', 10);
  if (migrationsInLedger !== 12) {
    throw new TmError(`Expected 12 migrations in ledger, found ${migrationsInLedger}`, 'TM_MIGRATIONS_FAILED');
  }

  const tableResult = await withTmTimeout(
    opts.pool.query<{ tbl: string | null }>("SELECT to_regclass('public.tm_organizations') AS tbl"),
    timeoutMs,
    'TM_MIGRATIONS_FAILED',
  );
  const organizationsTableExists = tableResult.rows[0]?.tbl !== null;
  if (!organizationsTableExists) {
    throw new TmError('tm_organizations table missing after migrations', 'TM_MIGRATIONS_FAILED');
  }

  return {
    migrationsOk: true,
    migrationsInLedger,
    organizationsTableExists,
  };
}
