import { Pool } from 'pg';

export async function setup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const { runMigrations, seedStandardConsents } = await import(
    '../../src/server/index.js'
  );
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await runMigrations(pool);
    await seedStandardConsents(pool, 'TestProduct');
  } finally {
    await pool.end();
  }
}
