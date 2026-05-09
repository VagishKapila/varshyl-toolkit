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

describeWithDb('ownership transfer — happy path', () => {
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

  it('owner initiates transfer → 201', async () => {
    currentUserId = 1;
    const res = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });

    expect(res.status).toBe(201);
    expect(res.body.transfer).toHaveProperty('id');
    expect(res.body.transfer.status).toBe('pending');
  });

  it('recipient can GET /orgs/1/transfer and sees pending transfer', async () => {
    currentUserId = 1;
    await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });

    currentUserId = 2;
    const res = await request(app).get('/orgs/1/transfer');

    expect(res.status).toBe(200);
    expect(res.body.transfer.status).toBe('pending');
    expect([res.body.transfer.to_user_id, res.body.transfer.toUserId]).toContain(2);
  });

  it('recipient accepts → 200, roles are swapped', async () => {
    // Initiate
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    expect(initRes.status).toBe(201);

    // Accept
    currentUserId = 2;
    const acceptRes = await request(app)
      .post('/orgs/1/transfer/accept')
      .send({});

    expect(acceptRes.status).toBe(200);

    // Verify roles in DB
    const memberships = await pool.query(
      `SELECT user_id, role FROM tm_memberships WHERE org_id = 1 AND user_id IN (1, 2)`
    );
    const byUser: Record<number, string> = {};
    for (const row of memberships.rows) {
      byUser[row.user_id] = row.role;
    }

    expect(byUser[2]).toBe('owner');
    expect(byUser[1]).toBe('admin'); // previous owner demoted to admin
  });

  it('both audit events are present after complete transfer', async () => {
    currentUserId = 1;
    await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });

    currentUserId = 2;
    await request(app)
      .post('/orgs/1/transfer/accept')
      .send({});

    const events = await pool.query(
      `SELECT action FROM tm_audit_events WHERE action IN ('ownership.transfer_initiated', 'ownership.transfer_accepted')`
    );
    const actions = events.rows.map((r: { action: string }) => r.action);

    expect(actions).toContain('ownership.transfer_initiated');
    expect(actions).toContain('ownership.transfer_accepted');
  });

  it('transfer record status is "completed" after acceptance', async () => {
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    const transferId = initRes.body.transfer.id;

    currentUserId = 2;
    await request(app)
      .post('/orgs/1/transfer/accept')
      .send({});

    const row = await pool.query(
      `SELECT status FROM tm_ownership_transfers WHERE id = $1`,
      [transferId]
    );
    expect(row.rows[0].status).toBe('completed');
  });

  it('org owner_user_id is updated to new owner in tm_organizations', async () => {
    currentUserId = 1;
    await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });

    currentUserId = 2;
    await request(app)
      .post('/orgs/1/transfer/accept')
      .send({});

    const org = await pool.query(`SELECT owner_user_id FROM tm_organizations WHERE id = 1`);
    expect(org.rows[0].owner_user_id).toBe(2);
  });
});
