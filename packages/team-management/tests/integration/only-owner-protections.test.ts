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

describeWithDb('only-owner protections', () => {
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

  it('owner removing themselves returns 400 with specific error message', async () => {
    const res = await request(app).delete('/orgs/1/members/1');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    const message: string = res.body.message;
    expect(message.toLowerCase()).toMatch(/owner|cannot remove|self/);
  });

  it('cannot set two members to owner role (DB constraint enforced)', async () => {
    // Directly attempt to insert a second owner via SQL
    await expect(
      pool.query(`INSERT INTO tm_memberships (org_id, user_id, role) VALUES (1, 5, 'owner')`)
    ).rejects.toThrow(); // unique constraint or check constraint on role = 'owner'
  });

  it('non-owner cannot initiate ownership transfer → 403', async () => {
    currentUserId = 2; // admin, not owner

    const res = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 3, confirmOrgName: 'Test Org 1' });

    expect(res.status).toBe(403);
  });

  it('member cannot initiate ownership transfer → 403', async () => {
    currentUserId = 3; // plain member

    const res = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });

    expect(res.status).toBe(403);
  });

  it('owner accepting invite to join another org while sole owner → 422', async () => {
    // Create a second org with a pending invite for user 1
    await pool.query(`INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings)
      VALUES (2, 'Second Org', 'second-org', 5, '{}')`);
    await pool.query(`INSERT INTO tm_invitations (org_id, inviter_user_id, email, role, token)
      VALUES (2, 5, 'u1@test.com', 'admin', 'invite-tok-xyz')`);

    currentOrgId = 2;
    const res = await request(app)
      .post('/orgs/2/invitations/invite-tok-xyz/accept');

    // 422 Unprocessable Entity — sole owner cannot accept invite while owning another org
    // (Allow 409 as alternate acceptable status)
    expect([409, 422]).toContain(res.status);
  });

  it('changing own role away from owner via PATCH is blocked → 400 or 403', async () => {
    const res = await request(app)
      .patch('/orgs/1/members/1')
      .send({ role: 'admin' });

    expect([400, 403]).toContain(res.status);
  });
});
