import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../src/server/index.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('migrations integration', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('runs all 11 migrations successfully', async () => {
    await runMigrations(pool);

    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM tm_schema_migrations`
    );
    expect(parseInt(result.rows[0].cnt, 10)).toBe(11);
  });

  it('is idempotent — re-running skips all 11 migrations', async () => {
    const before = await pool.query(
      `SELECT applied_at FROM tm_schema_migrations ORDER BY id`
    );

    await runMigrations(pool);

    const after = await pool.query(
      `SELECT applied_at FROM tm_schema_migrations ORDER BY id`
    );

    expect(after.rows.length).toBe(11);
    // applied_at timestamps must not have changed
    before.rows.forEach((row, i) => {
      expect(after.rows[i].applied_at.getTime()).toBe(row.applied_at.getTime());
    });
  });

  it('creates tm_organizations table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_organizations') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_memberships table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_memberships') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_invitations table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_invitations') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_audit_events table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_audit_events') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_ownership_transfers table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_ownership_transfers') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_super_admins table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_super_admins') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_password_reset_requests table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_password_reset_requests') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_email_change_requests table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_email_change_requests') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('creates tm_shared_access table', async () => {
    const res = await pool.query(
      `SELECT to_regclass('public.tm_shared_access') as tbl`
    );
    expect(res.rows[0].tbl).not.toBeNull();
  });

  it('tm_schema_migrations has exactly 11 rows', async () => {
    const res = await pool.query(`SELECT COUNT(*) as cnt FROM tm_schema_migrations`);
    expect(parseInt(res.rows[0].cnt, 10)).toBe(11);
  });
});
