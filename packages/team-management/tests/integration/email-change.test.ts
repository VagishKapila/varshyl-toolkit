import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

const sendEmailChangeVerification = vi.fn(async () => {});
const sendEmailChangeOldNotice = vi.fn(async () => {});
const sendEmailChangedFinalNotice = vi.fn(async () => {});
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
  setUserPassword: async () => {},
  hashPassword: async (p) => `h:${p}`,
  verifyPassword: async (p, h) => h === `h:${p}`,
  invalidateAllUserSessions: async () => {},
  sendInviteEmail: async () => {},
  sendOwnershipTransferEmail: async () => {},
  sendEmailChangeVerification,
  sendEmailChangeOldNotice,
  sendEmailChangedFinalNotice,
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

describeWithDb('email change flow', () => {
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
    sendEmailChangeVerification.mockClear();
    sendEmailChangeOldNotice.mockClear();
    sendEmailChangedFinalNotice.mockClear();
    sendPasswordResetEmail.mockClear();
    currentUserId = 3;
    currentOrgId = 1;
    await seedOrg(pool);
  });

  it('POST /me/email-change → 201 and calls verification + notice emails', async () => {
    const res = await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'new@example.com', currentPassword: 'mypassword' });

    expect(res.status).toBe(201);

    // Both verification and old-address notice should be sent
    expect(sendEmailChangeVerification).toHaveBeenCalledOnce();
    expect(sendEmailChangeOldNotice).toHaveBeenCalledOnce();

    // Verify row in DB
    const dbRow = await pool.query(
      `SELECT * FROM tm_email_change_requests WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1`
    );
    expect(dbRow.rows.length).toBe(1);
    expect(dbRow.rows[0].new_email).toBe('new@example.com');
    expect(dbRow.rows[0].status).toBe('pending');
  });

  it('GET /me/email-change/verify?token=:token → 200, email changed', async () => {
    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'verified@example.com', currentPassword: 'mypassword' });

    const row = await pool.query(
      `SELECT verify_token FROM tm_email_change_requests WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1`
    );
    expect(row.rows.length).toBe(1);
    const token: string = row.rows[0].verify_token;

    currentUserId = null; // token-based
    const res = await request(app)
      .get(`/me/email-change/verify?token=${token}`);

    expect(res.status).toBe(200);
    expect(sendEmailChangedFinalNotice).toHaveBeenCalledOnce();

    // Verify status updated in DB
    const updated = await pool.query(
      `SELECT status FROM tm_email_change_requests WHERE verify_token = $1`,
      [token]
    );
    expect(updated.rows[0].status).toBe('completed');
  });

  it('POST /me/email-change/cancel?token=:cancelToken → 200, change cancelled', async () => {
    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'cancel@example.com', currentPassword: 'mypassword' });

    const row = await pool.query(
      `SELECT cancel_token FROM tm_email_change_requests WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1`
    );
    expect(row.rows.length).toBe(1);
    const cancelToken: string = row.rows[0].cancel_token;

    currentUserId = null;
    const res = await request(app)
      .post(`/me/email-change/cancel?token=${cancelToken}`);

    expect(res.status).toBe(200);

    // Verify status updated
    const updated = await pool.query(
      `SELECT status FROM tm_email_change_requests WHERE cancel_token = $1`,
      [cancelToken]
    );
    expect(updated.rows[0].status).toBe('cancelled');
  });

  it('after cancel: sendPasswordResetEmail is triggered', async () => {
    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'reset-on-cancel@example.com', currentPassword: 'mypassword' });

    const row = await pool.query(
      `SELECT cancel_token FROM tm_email_change_requests WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1`
    );
    const cancelToken: string = row.rows[0].cancel_token;

    currentUserId = null;
    sendPasswordResetEmail.mockClear();
    await request(app).post(`/me/email-change/cancel?token=${cancelToken}`);

    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it('rate limit: 4th email-change request in 24h → 429', async () => {
    // Insert 3 existing requests within the last 24 hours
    const past = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
    for (let i = 0; i < 3; i++) {
      await pool.query(
        `INSERT INTO tm_email_change_requests (user_id, new_email, verify_token, cancel_token, status, created_at)
         VALUES (3, $1, $2, $3, 'pending', $4)`,
        [`rate${i}@example.com`, `vtok${i}`, `ctok${i}`, past]
      );
    }

    const res = await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'fourth@example.com', currentPassword: 'mypassword' });

    expect(res.status).toBe(429);
  });
});
