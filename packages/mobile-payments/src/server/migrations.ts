import type { Pool } from 'pg';
import { MP_MIGRATIONS } from './migrations.generated.js';
import { MpError } from './errors.js';
import { withMpTimeout } from './timeout.js';
import { DEFAULT_MP_CONNECTION_TIMEOUT_MS } from './pool.js';

export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS mp_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

export interface RunMigrationsOptions {
  /** Per-query timeout in ms (default 10000). */
  connectionTimeoutMs?: number;
}

export async function runMigrations(
  pool: Pool,
  logger: { info(msg: string): void } = { info: () => {} },
  opts: RunMigrationsOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  const timeoutMs = opts.connectionTimeoutMs ?? DEFAULT_MP_CONNECTION_TIMEOUT_MS;
  const applied: string[] = [];
  const skipped: string[] = [];
  const query = (sql: string, params?: unknown[]) =>
    withMpTimeout(pool.query(sql, params), timeoutMs, 'MP_MIGRATIONS_FAILED');

  try {
    await query(BOOTSTRAP_SQL);

    for (const migration of MP_MIGRATIONS) {
      const result = await query(
        'SELECT id FROM mp_schema_migrations WHERE migration = $1',
        [migration.name],
      );

      if (result.rows.length > 0) {
        skipped.push(migration.name);
        logger.info(`[mobile-payments] skipped: ${migration.name}`);
        continue;
      }

      await query(migration.sql);
      await query('INSERT INTO mp_schema_migrations (migration) VALUES ($1)', [migration.name]);

      applied.push(migration.name);
      logger.info(`[mobile-payments] applied: ${migration.name}`);
    }
  } catch (error) {
    if (error instanceof MpError) {
      throw error;
    }
    throw new MpError(
      error instanceof Error ? error.message : 'Migration failed',
      'MP_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  return { applied, skipped };
}
