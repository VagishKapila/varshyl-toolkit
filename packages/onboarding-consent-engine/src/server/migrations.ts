import type { Pool } from 'pg';
import { OCE_MIGRATIONS } from './migrations.generated.js';
import { OceError } from './errors.js';
import { withOceTimeout } from './timeout.js';
import { DEFAULT_OCE_CONNECTION_TIMEOUT_MS } from './pool.js';

export interface RunMigrationsOptions {
  /** Per-query timeout in ms (default 10000). */
  connectionTimeoutMs?: number;
}

export async function runMigrations(
  db: Pool,
  logger: { info(msg: string): void } = { info: () => {} },
  opts: RunMigrationsOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  const timeoutMs = opts.connectionTimeoutMs ?? DEFAULT_OCE_CONNECTION_TIMEOUT_MS;
  const applied: string[] = [];
  const skipped: string[] = [];

  const query = (sql: string, params?: unknown[]) =>
    withOceTimeout(db.query(sql, params), timeoutMs, 'OCE_MIGRATIONS_FAILED');

  try {
    const ledger = OCE_MIGRATIONS[0];
    if (!ledger) {
      throw new OceError('No migrations bundled', 'OCE_MIGRATIONS_FAILED');
    }

    await query(ledger.sql);

    for (const migration of OCE_MIGRATIONS) {
      const result = await query(
        'SELECT id FROM oce_schema_migrations WHERE migration = $1',
        [migration.name],
      );
      if (result.rows.length > 0) {
        skipped.push(migration.name);
        continue;
      }
      await query(migration.sql);
      await query('INSERT INTO oce_schema_migrations (migration) VALUES ($1)', [migration.name]);
      logger.info(`[oce] applied migration: ${migration.name}`);
      applied.push(migration.name);
    }
  } catch (error) {
    if (error instanceof OceError) {
      throw error;
    }
    throw new OceError(
      error instanceof Error ? error.message : 'Migration failed',
      'OCE_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  return { applied, skipped };
}
