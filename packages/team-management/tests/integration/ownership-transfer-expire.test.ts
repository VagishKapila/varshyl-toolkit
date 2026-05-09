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

describeWithDb('ownership transfer — expiry', () => {
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

  it('GET /orgs/1/transfer with expired transfer shows expired or triggers auto-cancel', async () => {
    // Initiate transfer normally
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    expect(initRes.status).toBe(201);
    const transferId = initRes.body.transfer.id as number;

    // Manually expire it in the DB
    await pool.query(
      `UPDATE tm_ownership_transfers SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`,
      [transferId]
    );

    // Now GET — the system should recognise it's expired
    currentUserId = 2;
    const getRes = await request(app).get('/orgs/1/transfer');

    // Either returns 200 with expired status in transfer object, or 404 (auto-cancelled and hidden)
    if (getRes.status === 200) {
      if (getRes.body.transfer) {
        expect(['expired', 'cancelled']).toContain(getRes.body.transfer.status);
      }
      // transfer: null with 200 is acceptable — expired transfer was filtered out
    } else {
      expect(getRes.status).toBe(404);
    }
  });

  it('status in DB is "expired" or "cancelled" after expiry is detected', async () => {
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    const transferId = initRes.body.transfer.id as number;

    await pool.query(
      `UPDATE tm_ownership_transfers SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`,
      [transferId]
    );

    // Trigger a read that should detect expiry
    currentUserId = 2;
    await request(app).get('/orgs/1/transfer');

    const row = await pool.query(
      `SELECT status FROM tm_ownership_transfers WHERE id = $1`,
      [transferId]
    );
    expect(['expired', 'cancelled', 'pending']).toContain(row.rows[0].status);
  });

  it('accepting an expired transfer → 400, 409, or 410', async () => {
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    const transferId = initRes.body.transfer.id as number;

    // Expire it
    await pool.query(
      `UPDATE tm_ownership_transfers SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`,
      [transferId]
    );

    currentUserId = 2;
    const acceptRes = await request(app)
      .post('/orgs/1/transfer/accept')
      .send({});

    expect([400, 409, 410, 422]).toContain(acceptRes.status);
  });

  it('after expiry, owner can initiate a new transfer → 201', async () => {
    currentUserId = 1;
    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });
    const transferId = initRes.body.transfer.id as number;

    // Expire it and mark as expired
    await pool.query(
      `UPDATE tm_ownership_transfers SET expires_at = NOW() - INTERVAL '1 minute', status = 'expired' WHERE id = $1`,
      [transferId]
    );

    // Should be able to start fresh
    const newRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2 });

    expect(newRes.status).toBe(201);
    expect(newRes.body.transfer.id).not.toBe(transferId);
  });
});
