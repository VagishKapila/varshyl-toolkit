/**
 * Vitest global setup — applies auth-social migrations before integration tests.
 */
import { Pool } from 'pg';

export async function setup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const { runMigrations } = await import('../../src/server/migrations.js');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}

export async function teardown(): Promise<void> {}
