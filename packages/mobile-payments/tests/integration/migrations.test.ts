import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../src/server/migrations.js';
import { MP_MIGRATIONS } from '../../src/server/migrations.generated.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('mobile-payments migrations', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('runs all 3 migrations successfully', async () => {
    await runMigrations(pool);
    const result = await pool.query(`SELECT COUNT(*) as cnt FROM mp_schema_migrations`);
    expect(parseInt(result.rows[0].cnt, 10)).toBe(MP_MIGRATIONS.length);
  });

  it('is idempotent', async () => {
    const second = await runMigrations(pool);
    expect(second.applied.length).toBe(0);
    expect(second.skipped.length).toBe(MP_MIGRATIONS.length);
  });

  it('creates mp_* tables', async () => {
    for (const table of ['mp_subscriptions', 'mp_subscription_events', 'mp_seat_assignments']) {
      const result = await pool.query(`SELECT to_regclass('public.${table}') AS reg`);
      expect(result.rows[0].reg).not.toBeNull();
    }
  });
});
