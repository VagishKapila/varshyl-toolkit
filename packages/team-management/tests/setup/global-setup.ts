/**
 * Vitest global setup — runs once before any test suite.
 * Applies all team-management migrations so integration tests have a
 * fully-migrated database without each test file needing to call runMigrations().
 */
import { Pool } from 'pg';

export async function setup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return; // unit-only runs skip this

  // Dynamically import to avoid issues with import.meta.url in globalSetup context
  const { runMigrations } = await import('../../src/server/index.js');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
