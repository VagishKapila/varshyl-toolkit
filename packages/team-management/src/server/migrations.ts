import type { Pool } from 'pg';
import { TM_MIGRATIONS } from './migrations.generated.js';
import { TmError } from './errors.js';
import { withTmTimeout } from './timeout.js';
import { DEFAULT_TM_CONNECTION_TIMEOUT_MS } from './pool.js';

export interface RunMigrationsOptions {
  /** Per-query timeout in ms (default 10000). */
  connectionTimeoutMs?: number;
}

export async function runMigrations(
  db: Pool,
  logger: { info(msg: string): void } = { info: () => {} },
  opts: RunMigrationsOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  const timeoutMs = opts.connectionTimeoutMs ?? DEFAULT_TM_CONNECTION_TIMEOUT_MS;
  const applied: string[] = [];
  const skipped: string[] = [];

  const query = (sql: string, params?: unknown[]) =>
    withTmTimeout(db.query(sql, params), timeoutMs, 'TM_MIGRATIONS_FAILED');

  try {
    const ledger = TM_MIGRATIONS[0];
    if (!ledger) {
      throw new TmError('No migrations bundled', 'TM_MIGRATIONS_FAILED');
    }

    await query(ledger.sql);

    for (const migration of TM_MIGRATIONS) {
      const result = await query(
        'SELECT id FROM tm_schema_migrations WHERE migration = $1',
        [migration.name],
      );
      if (result.rows.length > 0) {
        skipped.push(migration.name);
        continue;
      }

      await query(migration.sql);
      await query('INSERT INTO tm_schema_migrations (migration) VALUES ($1)', [migration.name]);
      logger.info(`[team-management] applied: ${migration.name}`);
      applied.push(migration.name);
    }
  } catch (error) {
    if (error instanceof TmError) {
      throw error;
    }
    throw new TmError(error instanceof Error ? error.message : 'Migration failed', 'TM_MIGRATIONS_FAILED', {
      cause: error,
    });
  }

  return { applied, skipped };
}
