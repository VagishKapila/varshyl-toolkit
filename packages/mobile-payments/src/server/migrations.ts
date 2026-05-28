import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Pool } from 'pg';

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');

const MIGRATIONS: Array<{ name: string; file: string }> = [
  { name: '0001_create_mp_subscriptions', file: join(MIGRATIONS_DIR, '0001_create_mp_subscriptions.sql') },
  { name: '0002_create_mp_subscription_events', file: join(MIGRATIONS_DIR, '0002_create_mp_subscription_events.sql') },
  { name: '0003_create_mp_seat_assignments', file: join(MIGRATIONS_DIR, '0003_create_mp_seat_assignments.sql') },
];

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS mp_schema_migrations (
  id          SERIAL       PRIMARY KEY,
  migration   VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

export async function runMigrations(
  pool: Pool,
  logger: { info(msg: string): void } = { info: () => {} }
): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = [];
  const skipped: string[] = [];

  await pool.query(BOOTSTRAP_SQL);

  for (const migration of MIGRATIONS) {
    const result = await pool.query(
      'SELECT id FROM mp_schema_migrations WHERE migration = $1',
      [migration.name]
    );

    if (result.rows.length > 0) {
      skipped.push(migration.name);
      logger.info(`[mobile-payments] skipped: ${migration.name}`);
      continue;
    }

    const sql = readFileSync(migration.file, 'utf-8');
    await pool.query(sql);
    await pool.query(
      'INSERT INTO mp_schema_migrations (migration) VALUES ($1)',
      [migration.name]
    );

    applied.push(migration.name);
    logger.info(`[mobile-payments] applied: ${migration.name}`);
  }

  return { applied, skipped };
}

export { MIGRATIONS };
