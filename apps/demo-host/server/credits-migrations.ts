import type { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS sc_schema_migrations (
  migration   VARCHAR(255) PRIMARY KEY,
  applied_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
`;

const MIGRATION_NAME = '0001_create_sc_credit_tables';

export async function runCreditsMigrations(
  pool: Pool,
): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = [];
  const skipped: string[] = [];

  await pool.query(BOOTSTRAP_SQL);

  const existing = await pool.query(
    'SELECT migration FROM sc_schema_migrations WHERE migration = $1',
    [MIGRATION_NAME],
  );

  if (existing.rows.length > 0) {
    skipped.push(MIGRATION_NAME);
    return { applied, skipped };
  }

  const sql = readFileSync(
    path.join(__dirname, 'migrations', `${MIGRATION_NAME}.sql`),
    'utf8',
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO sc_schema_migrations (migration) VALUES ($1)',
      [MIGRATION_NAME],
    );
    await client.query('COMMIT');
    applied.push(MIGRATION_NAME);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { applied, skipped };
}
