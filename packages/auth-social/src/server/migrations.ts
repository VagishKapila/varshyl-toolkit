import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Pool } from 'pg';

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');

const MIGRATIONS: Array<{ name: string; file: string }> = [
  { name: '0001_create_as_credentials', file: join(MIGRATIONS_DIR, '0001_create_as_credentials.sql') },
  { name: '0002_create_as_oauth_identities', file: join(MIGRATIONS_DIR, '0002_create_as_oauth_identities.sql') },
  { name: '0003_create_as_sessions', file: join(MIGRATIONS_DIR, '0003_create_as_sessions.sql') },
  { name: '0004_create_as_password_resets', file: join(MIGRATIONS_DIR, '0004_create_as_password_resets.sql') },
];

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
  logger: { info(msg: string): void } = { info: () => {} }
): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = [];
  const skipped: string[] = [];

  await pool.query(BOOTSTRAP_SQL);

  for (const migration of MIGRATIONS) {
    const result = await pool.query(
      'SELECT id FROM as_schema_migrations WHERE migration = $1',
      [migration.name]
    );

    if (result.rows.length > 0) {
      skipped.push(migration.name);
      logger.info(`[auth-social] skipped: ${migration.name}`);
      continue;
    }

    const sql = readFileSync(migration.file, 'utf-8');
    await pool.query(sql);
    await pool.query(
      'INSERT INTO as_schema_migrations (migration) VALUES ($1)',
      [migration.name]
    );

    applied.push(migration.name);
    logger.info(`[auth-social] applied: ${migration.name}`);
  }

  return { applied, skipped };
}

export { MIGRATIONS };
