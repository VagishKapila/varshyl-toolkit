import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations, MIGRATIONS } from '../../src/server/migrations.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('auth-social migrations', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('applies all migrations idempotently', async () => {
    const first = await runMigrations(pool);
    expect(first.applied.length).toBe(MIGRATIONS.length);

    const second = await runMigrations(pool);
    expect(second.applied).toHaveLength(0);
    expect(second.skipped.length).toBe(MIGRATIONS.length);
  });

  it('creates as_* tables', async () => {
    for (const table of ['as_credentials', 'as_oauth_identities', 'as_sessions', 'as_password_resets']) {
      const result = await pool.query(`SELECT to_regclass('public.${table}') AS reg`);
      expect(result.rows[0].reg).not.toBeNull();
    }
  });
});
