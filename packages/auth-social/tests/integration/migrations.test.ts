import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations, MIGRATIONS } from '../../src/server/migrations.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('auth-social migrations', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('runs all 4 migrations successfully', async () => {
    await runMigrations(pool);

    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM as_schema_migrations`
    );
    expect(parseInt(result.rows[0].cnt, 10)).toBe(MIGRATIONS.length);
  });

  it('is idempotent — re-running skips all 4 migrations', async () => {
    const before = await pool.query(
      `SELECT applied_at FROM as_schema_migrations ORDER BY id`
    );

    const second = await runMigrations(pool);
    expect(second.applied.length).toBe(0);

    const after = await pool.query(
      `SELECT applied_at FROM as_schema_migrations ORDER BY id`
    );

    expect(after.rows.length).toBe(MIGRATIONS.length);
    before.rows.forEach((row, i) => {
      expect(after.rows[i].applied_at.getTime()).toBe(row.applied_at.getTime());
    });
  });

  it('creates as_* tables', async () => {
    for (const table of ['as_credentials', 'as_oauth_identities', 'as_sessions', 'as_password_resets']) {
      const result = await pool.query(`SELECT to_regclass('public.${table}') AS reg`);
      expect(result.rows[0].reg).not.toBeNull();
    }
  });

  it('as_schema_migrations has exactly 4 rows', async () => {
    const result = await pool.query(`SELECT COUNT(*) as cnt FROM as_schema_migrations`);
    expect(parseInt(result.rows[0].cnt, 10)).toBe(MIGRATIONS.length);
  });
});
