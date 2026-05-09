import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

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
  sendEmailChangeVerification: async () => {},
  sendEmailChangeOldNotice: async () => {},
  sendEmailChangedFinalNotice: async () => {},
  sendPasswordResetEmail: async () => {},
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

async function initiateTransfer(app: express.Express): Promise<number> {
  currentUserId = 1;
  const res = await request(app)
    .post('/orgs/1/transfer')
    .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

describeWithDb('ownership transfer — cancellation', () => {
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
    currentUserId = 1;
    currentOrgId = 1;
    await seedOrg(pool);
  });

  it('owner (initiator) can cancel a pending transfer → 200, status = cancelled', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 1;
    const cancelRes = await request(app)
      .post(`/orgs/1/transfer/${transferId}/cancel`);

    expect(cancelRes.status).toBe(200);

    const row = await pool.query(
      `SELECT status FROM tm_ownership_transfers WHERE id = $1`,
      [transferId]
    );
    expect(row.rows[0].status).toBe('cancelled');
  });

  it('after owner cancels, a new transfer can be initiated → 201', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 1;
    await request(app).post(`/orgs/1/transfer/${transferId}/cancel`);

    // Should be able to start a fresh transfer
    const newRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });

    expect(newRes.status).toBe(201);
    expect(newRes.body.id).not.toBe(transferId);
    expect(newRes.body.status).toBe('pending');
  });

  it('recipient (admin) can cancel a pending transfer → 200, status = cancelled', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 2; // recipient cancels
    const cancelRes = await request(app)
      .post(`/orgs/1/transfer/${transferId}/cancel`);

    expect(cancelRes.status).toBe(200);

    const row = await pool.query(
      `SELECT status FROM tm_ownership_transfers WHERE id = $1`,
      [transferId]
    );
    expect(row.rows[0].status).toBe('cancelled');
  });

  it('after recipient cancels, a new transfer can be initiated → 201', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 2;
    await request(app).post(`/orgs/1/transfer/${transferId}/cancel`);

    currentUserId = 1;
    const newRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });

    expect(newRes.status).toBe(201);
  });

  it('unrelated member cannot cancel a transfer → 403', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 3; // plain member, not party to the transfer
    const cancelRes = await request(app)
      .post(`/orgs/1/transfer/${transferId}/cancel`);

    expect(cancelRes.status).toBe(403);

    // Status should still be pending
    const row = await pool.query(
      `SELECT status FROM tm_ownership_transfers WHERE id = $1`,
      [transferId]
    );
    expect(row.rows[0].status).toBe('pending');
  });

  it('cancelling an already-cancelled transfer → 400 or 409', async () => {
    const transferId = await initiateTransfer(app);

    currentUserId = 1;
    await request(app).post(`/orgs/1/transfer/${transferId}/cancel`);

    // Try to cancel again
    const res = await request(app).post(`/orgs/1/transfer/${transferId}/cancel`);
    expect([400, 409]).toContain(res.status);
  });
});
