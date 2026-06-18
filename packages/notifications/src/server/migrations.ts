import { NT_MIGRATIONS } from './migrations.generated.js';
import { NtError } from './errors.js';

export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS nt_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

export interface RunMigrationsOptions {
  connectionTimeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new NtError(`Query timed out after ${ms}ms`, 'NT_MIGRATIONS_FAILED')), ms);
    }),
  ]);
}

export async function runMigrations(
  pool: import('pg').Pool,
  logger: { info(msg: string): void } = { info: () => {} },
  opts: RunMigrationsOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  const timeoutMs = opts.connectionTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await withTimeout(pool.query(BOOTSTRAP_SQL), timeoutMs);

    for (const migration of NT_MIGRATIONS) {
      const result = await withTimeout(
        pool.query('SELECT id FROM nt_schema_migrations WHERE migration = $1', [migration.name]),
        timeoutMs,
      );

      if (result.rows.length > 0) {
        skipped.push(migration.name);
        continue;
      }

      await withTimeout(pool.query(migration.sql), timeoutMs);
      await withTimeout(
        pool.query('INSERT INTO nt_schema_migrations (migration) VALUES ($1)', [migration.name]),
        timeoutMs,
      );
      applied.push(migration.name);
      logger.info(`[notifications] applied migration ${migration.name}`);
    }
  } catch (error) {
    if (error instanceof NtError) throw error;
    throw new NtError(
      error instanceof Error ? error.message : 'Migrations failed',
      'NT_MIGRATIONS_FAILED',
      { cause: error },
    );
  }

  return { applied, skipped };
}
