import type { Pool } from 'pg';
import { AS_MIGRATIONS } from './migrations.generated.js';
import { AsError } from './errors.js';
import { withAsTimeout } from './timeout.js';
import { DEFAULT_AS_CONNECTION_TIMEOUT_MS } from './pool.js';

/** @deprecated Migrations are bundled at build time; this path is no longer used at runtime. */
export const MIGRATIONS_DIR = '(inlined-at-build-time)';
export const MIGRATIONS = AS_MIGRATIONS;

const BOOTSTRAP_SQL = `
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS as_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

export async function runMigrations(
  pool: Pool,
  logger: { info(msg: string): void } = { info: () => {} },
  opts: RunMigrationsOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  const timeoutMs = opts.connectionTimeoutMs ?? DEFAULT_AS_CONNECTION_TIMEOUT_MS;
  const applied: string[] = [];
  const skipped: string[] = [];
  const query = (sql: string, params?: unknown[]) =>
    withAsTimeout(pool.query(sql, params), timeoutMs, 'AS_MIGRATIONS_FAILED');

  try {
    await query(BOOTSTRAP_SQL);

    for (const migration of AS_MIGRATIONS) {
      const result = await query('SELECT id FROM as_schema_migrations WHERE migration = $1', [
        migration.name,
      ]);

      if (result.rows.length > 0) {
        skipped.push(migration.name);
        logger.info(`[auth-social] skipped: ${migration.name}`);
        continue;
      }

      await query(migration.sql);
      await query('INSERT INTO as_schema_migrations (migration) VALUES ($1)', [migration.name]);

      applied.push(migration.name);
      logger.info(`[auth-social] applied: ${migration.name}`);
    }
  } catch (error) {
    if (error instanceof AsError) {
      throw error;
    }
    throw new AsError(
      error instanceof Error ? error.message : 'Migration failed',
      'AS_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  return { applied, skipped };
}

export interface RunMigrationsOptions {
  /** Per-query timeout in ms (default 10000). */
  connectionTimeoutMs?: number;
}
