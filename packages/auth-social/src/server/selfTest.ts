import type { Pool } from 'pg';
import { runMigrations, type RunMigrationsOptions } from './migrations.js';
import { withAsTimeout } from './timeout.js';
import { AsError } from './errors.js';
import {
  DEFAULT_AS_CONNECTION_TIMEOUT_MS,
  DEFAULT_AS_OPERATION_TIMEOUT_MS,
} from './pool.js';

export interface AsSelfTestResult {
  migrationsOk: boolean;
  tablesFound: string[];
}

export interface AsSelfTestOptions extends RunMigrationsOptions {
  pool: Pool;
  /** Per-operation timeout for read checks (default 5000ms). */
  timeoutMs?: number;
}

/**
 * Boot-time wiring check: apply migrations and verify expected table(s) exist.
 * Throws AsError on failure — never hangs (timeouts enforced).
 */
export async function asSelfTest(opts: AsSelfTestOptions): Promise<AsSelfTestResult> {
  const connectionTimeoutMs = opts.connectionTimeoutMs ?? DEFAULT_AS_CONNECTION_TIMEOUT_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_AS_OPERATION_TIMEOUT_MS;

  try {
    const result = await runMigrations(opts.pool, undefined, { connectionTimeoutMs });
    if (result.applied.length + result.skipped.length !== 4) {
      throw new AsError(
        `Expected 4 migrations, got ${result.applied.length + result.skipped.length}`,
        'AS_MIGRATIONS_FAILED',
      );
    }
  } catch (error) {
    if (error instanceof AsError) {
      throw error;
    }
    throw new AsError(
      error instanceof Error ? error.message : 'Migrations failed',
      'AS_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  const tableResult = await withAsTimeout(
    opts.pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'as_credentials'
       ORDER BY table_name`,
    ),
    timeoutMs,
  );
  const tablesFound = tableResult.rows.map((row) => row.table_name);
  if (!tablesFound.includes('as_credentials')) {
    throw new AsError('Missing as_credentials table after migrations', 'AS_MIGRATIONS_FAILED');
  }

  return {
    migrationsOk: true,
    tablesFound,
  };
}
