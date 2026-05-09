import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

const sendPasswordResetEmail = vi.fn(async () => {});

const testAdapter: ServerModuleAdapter = {
  getCurrentUserId: async () => currentUserId,
  getOrganizationIdForUser: async () => currentOrgId,
  isUserOrgAdmin: async (userId) => userId <= 2,
  logger: { info: () => {}, warn: () => {}, error: () => {} },
  getUserById: async (id) => ({ id, email: `u${id}@test.com`, name: `User${id}` }),
  getUsersByIds: async (ids) => ids.map(id => ({ id, email: `u${id}@test.com`, name: `User${id}` })),
  findUserByEmail: async (email) => {
    const m = email.match(/^u(\d+)@test\.com$/);
    return m ? { id: parseInt(m[1]), email } : null;
  },
  createUserFromInvite: async ({ email }: { email: string; orgId: number; role: OrgRole }) => ({ id: 99, email }),
  setUserPassword: vi.fn(async () => {}),
  hashPassword: async (p) => `h:${p}`,
  verifyPassword: async (p, h) => h === `h:${p}`,
  invalidateAllUserSessions: async () => {},
  sendInviteEmail: async () => {},
  sendOwnershipTransferEmail: async () => {},
  sendEmailChangeVerification: async () => {},
  sendEmailChangeOldNotice: async () => {},
  sendEmailChangedFinalNotice: async () => {},
  sendPasswordResetEmail,
  sendOrgDeletionNotice: async () => {},
  emitNotification: async () => {},
};

async function cleanAll(pool: Pool) {
  await pool.query(`TRUNCATE tm_super_admins, tm_password_reset_requests,
    tm_email_change_requests, tm_ownership_transfers, tm_audit_events,
    tm_invitations, tm_memberships, tm_organizations RESTART IDENTITY CASCADE`);
}

async function seedOrg(pool: Pool, orgId = 1) {
  await pool.query(`INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings)
    VALUES (${orgId}, 'Test Org ${orgId}', 'test-org-${orgId}', 1, '{}') ON CONFLICT DO NOTHING`);
  await pool.query(`INSERT INTO tm_memberships (org_id, user_id, role) VALUES
    (${orgId}, 1, 'owner'), (${orgId}, 2, 'admin'), (${orgId}, 3, 'member'), (${orgId}, 4, 'viewer')
    ON CONFLICT DO NOTHING`);
}

describeWithDb('password reset flow', () => {
  let pool: Pool;
  let app: express.Express;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const mod = createServerModule({ adapter: testAdapter, pool, features: {} });
    app = express();
    app.use(express.json());
    app.use(mod.router);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanAll(pool);
    sendPasswordResetEmail.mockClear();
    (testAdapter.setUserPassword as ReturnType<typeof vi.fn>).mockClear?.();
    currentUserId = null; // password reset is unauthenticated
    currentOrgId = null;
    await seedOrg(pool);
  });

  it('POST /me/password-reset/request with existing email → 200', async () => {
    const res = await request(app)
      .post('/me/password-reset/request')
      .send({ email: 'u1@test.com' });

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();

    const dbRow = await pool.query(
      `SELECT * FROM tm_password_reset_requests WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1`
    );
    expect(dbRow.rows.length).toBe(1);
    expect(dbRow.rows[0].used).toBe(false);
  });

  it('POST /me/password-reset/request with unknown email → 200 (no user enumeration)', async () => {
    const res = await request(app)
      .post('/me/password-reset/request')
      .send({ email: 'nonexistent@example.com' });

    // Must return 200 even for unknown emails — prevents user enumeration
    expect(res.status).toBe(200);
    // Email must NOT be sent for unknown users
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('POST /me/password-reset/confirm with valid token → 200 and password updated', async () => {
    // Request first to get a token
    await request(app)
      .post('/me/password-reset/request')
      .send({ email: 'u1@test.com' });

    const row = await pool.query(
      `SELECT token FROM tm_password_reset_requests WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1`
    );
    expect(row.rows.length).toBe(1);
    const token: string = row.rows[0].token;

    const confirmRes = await request(app)
      .post('/me/password-reset/confirm')
      .send({ token, newPassword: 'NewSecurePass123!' });

    expect(confirmRes.status).toBe(200);
    expect(testAdapter.setUserPassword).toHaveBeenCalledOnce();
  });

  it('POST /me/password-reset/confirm with used token → 400', async () => {
    await request(app)
      .post('/me/password-reset/request')
      .send({ email: 'u1@test.com' });

    const row = await pool.query(
      `SELECT token FROM tm_password_reset_requests WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1`
    );
    const token: string = row.rows[0].token;

    // Use it once
    await request(app)
      .post('/me/password-reset/confirm')
      .send({ token, newPassword: 'FirstUse!' });

    // Try to use again
    const res = await request(app)
      .post('/me/password-reset/confirm')
      .send({ token, newPassword: 'SecondUse!' });

    expect(res.status).toBe(400);
  });

  it('POST /me/password-reset/confirm with expired token → 400', async () => {
    // Insert an expired token directly
    const expiredAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    await pool.query(
      `INSERT INTO tm_password_reset_requests (user_id, token, expires_at, used, created_at)
       VALUES (1, 'expired-tok-xyz', $1, false, NOW())`,
      [expiredAt]
    );

    const res = await request(app)
      .post('/me/password-reset/confirm')
      .send({ token: 'expired-tok-xyz', newPassword: 'DoesNotMatter!' });

    expect(res.status).toBe(400);
  });

  it('rate limit: 4th password reset request per hour → 429', async () => {
    const recent = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 min ago
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    for (let i = 0; i < 3; i++) {
      await pool.query(
        `INSERT INTO tm_password_reset_requests (user_id, token, expires_at, used, created_at)
         VALUES (1, $1, $2, false, $3)`,
        [`rate-tok-${i}`, futureExpiry, recent]
      );
    }

    const res = await request(app)
      .post('/me/password-reset/request')
      .send({ email: 'u1@test.com' });

    expect(res.status).toBe(429);
  });
});
