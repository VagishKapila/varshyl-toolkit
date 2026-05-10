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

describeWithDb('ownership transfer — locks', () => {
  let pool: Pool;
  let app: express.Express;
  let pendingTransferId: number;

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

    // Establish a pending transfer for all lock tests
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    expect(initRes.status).toBe(201);
    pendingTransferId = initRes.body.transfer.id as number;
  });

  it('initiating another transfer while one is pending → 409 or 422', async () => {
    currentUserId = 1;
    const res = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 3 });

    expect([409, 422]).toContain(res.status);
  });

  it('deleting the org while transfer is pending → 409', async () => {
    currentUserId = 1;
    const res = await request(app)
      .delete('/orgs/1')
      .send({ confirmOrgName: 'Test Org 1' });

    expect(res.status).toBe(409);
  });

  it('removing the transfer recipient while transfer is pending → 409', async () => {
    currentUserId = 1;
    const res = await request(app).delete('/orgs/1/members/2');

    expect(res.status).toBe(409);
  });

  it('removing the transfer initiator (owner) while transfer is pending → 409 or 400', async () => {
    // Switch to an admin trying to remove the owner — should be 409 or 400
    currentUserId = 2;
    const res = await request(app).delete('/orgs/1/members/1');

    // Could be 400 (owner protection) or 409 (transfer lock) — both acceptable
    expect([400, 403, 409]).toContain(res.status);
  });

  it('changing recipient role while transfer is pending → 409', async () => {
    currentUserId = 1;
    const res = await request(app)
      .patch('/orgs/1/members/2')
      .send({ role: 'member' });

    expect(res.status).toBe(409);
  });

  it('after cancelling the transfer, org delete is no longer locked', async () => {
    currentUserId = 1;
    await request(app).delete('/orgs/1/transfer');

    const deleteRes = await request(app)
      .delete('/orgs/1')
      .send({ confirmOrgName: 'Test Org 1' });

    // Should no longer be 409 — either succeeds or fails for another reason
    expect(deleteRes.status).not.toBe(409);
  });

  it('after cancelling the transfer, removing members is no longer locked', async () => {
    currentUserId = 1;
    await request(app).delete('/orgs/1/transfer');

    const removeRes = await request(app).delete('/orgs/1/members/3');
    expect(removeRes.status).not.toBe(409);
  });
});
