import type { Pool } from 'pg';
import { runMigrations, type RunMigrationsOptions } from './migrations.js';
import { withMpTimeout } from './timeout.js';
import { MpError } from './errors.js';
import {
  DEFAULT_MP_CONNECTION_TIMEOUT_MS,
  DEFAULT_MP_OPERATION_TIMEOUT_MS,
} from './pool.js';
import { MP_MIGRATIONS } from './migrations.generated.js';

export interface MpSelfTestResult {
  migrationsOk: boolean;
  migrationCount: number;
  subscriptionsTableExists: boolean;
}

export interface MpSelfTestOptions extends RunMigrationsOptions {
  pool: Pool;
  /** Per-operation timeout for verification checks (default 5000ms). */
  timeoutMs?: number;
}

/**
 * Boot-time wiring check: apply migrations and verify key DB assets exist.
 * Throws MpError on failure — never hangs (timeouts enforced).
 */
export async function mpSelfTest(opts: MpSelfTestOptions): Promise<MpSelfTestResult> {
  const connectionTimeoutMs = opts.connectionTimeoutMs ?? DEFAULT_MP_CONNECTION_TIMEOUT_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_MP_OPERATION_TIMEOUT_MS;

  try {
    const result = await runMigrations(opts.pool, undefined, { connectionTimeoutMs });
    const totalMigrations = result.applied.length + result.skipped.length;
    if (totalMigrations !== MP_MIGRATIONS.length || MP_MIGRATIONS.length !== 3) {
      throw new MpError(
        `Expected 3 bundled migrations, found ${MP_MIGRATIONS.length} bundled and ${totalMigrations} executed/skipped`,
        'MP_MIGRATIONS_FAILED',
      );
    }
  } catch (error) {
    if (error instanceof MpError) {
      throw error;
    }
    throw new MpError(
      error instanceof Error ? error.message : 'Migrations failed',
      'MP_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  const tableCheck = await withMpTimeout(
    opts.pool.query<{ reg: string | null }>("SELECT to_regclass('public.mp_subscriptions') AS reg"),
    timeoutMs,
    'MP_MIGRATIONS_FAILED',
  );
  const subscriptionsTableExists = tableCheck.rows[0]?.reg !== null;
  if (!subscriptionsTableExists) {
    throw new MpError('mp_subscriptions table was not created', 'MP_MIGRATIONS_FAILED');
  }

  return {
    migrationsOk: true,
    migrationCount: MP_MIGRATIONS.length,
    subscriptionsTableExists: true,
  };
}
