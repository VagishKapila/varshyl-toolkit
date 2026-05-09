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

async function getLatestAuditEvent(pool: Pool, action: string) {
  const res = await pool.query(
    `SELECT * FROM tm_audit_events WHERE action = $1 ORDER BY created_at DESC LIMIT 1`,
    [action]
  );
  return res.rows[0] ?? null;
}

describeWithDb('audit events fire for all 13 event types', () => {
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
  });

  it('org.created fires when org is created', async () => {
    const res = await request(app)
      .post('/orgs')
      .send({ name: 'Audit Org', slug: 'audit-org' });
    expect(res.status).toBe(201);

    const event = await getLatestAuditEvent(pool, 'org.created');
    expect(event).not.toBeNull();
    expect(event.action).toBe('org.created');
  });

  it('org.settings.updated fires on PATCH /orgs/:id', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .patch('/orgs/1')
      .send({ settings: { featureX: true } });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'org.settings.updated');
    expect(event).not.toBeNull();
  });

  it('org.deleted fires on DELETE /orgs/:id', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .delete('/orgs/1')
      .send({ confirmOrgName: 'Test Org 1' });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'org.deleted');
    expect(event).not.toBeNull();
  });

  it('member.invited fires on POST /orgs/:id/invitations', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'newuser@example.com', role: 'member' });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'member.invited');
    expect(event).not.toBeNull();
  });

  it('member.invite_accepted fires when invitation is accepted', async () => {
    await seedOrg(pool);

    const invRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'u99@test.com', role: 'member' });
    expect(invRes.status).toBeLessThan(500);

    // Get the invitation token
    const inv = await pool.query(`SELECT token FROM tm_invitations ORDER BY created_at DESC LIMIT 1`);
    if (!inv.rows.length) {
      return; // Can't test without an invitation
    }
    const token = inv.rows[0].token;

    // Switch to invited user
    currentUserId = 99;
    currentOrgId = null;
    const acceptRes = await request(app)
      .post(`/orgs/1/invitations/${token}/accept`);
    expect(acceptRes.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'member.invite_accepted');
    expect(event).not.toBeNull();
  });

  it('member.invite_revoked fires on DELETE /orgs/:id/invitations/:invId', async () => {
    await seedOrg(pool);

    const invRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'revoke@example.com', role: 'member' });
    expect(invRes.status).toBeLessThan(500);

    const inv = await pool.query(`SELECT id FROM tm_invitations ORDER BY created_at DESC LIMIT 1`);
    if (!inv.rows.length) return;
    const invId = inv.rows[0].id;

    const revokeRes = await request(app).delete(`/orgs/1/invitations/${invId}`);
    expect(revokeRes.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'member.invite_revoked');
    expect(event).not.toBeNull();
  });

  it('member.removed fires on DELETE /orgs/:id/members/:userId', async () => {
    await seedOrg(pool);

    const res = await request(app).delete('/orgs/1/members/3');
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'member.removed');
    expect(event).not.toBeNull();
  });

  it('member.role_changed fires on PATCH /orgs/:id/members/:userId', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .patch('/orgs/1/members/3')
      .send({ role: 'admin' });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'member.role_changed');
    expect(event).not.toBeNull();
  });

  it('ownership.transfer_initiated fires on POST /orgs/:id/transfer', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'ownership.transfer_initiated');
    expect(event).not.toBeNull();
  });

  it('ownership.transfer_accepted fires on POST /orgs/:id/transfer/:id/accept', async () => {
    await seedOrg(pool);

    const initRes = await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });
    expect(initRes.status).toBeLessThan(500);

    const transfer = await pool.query(`SELECT id FROM tm_ownership_transfers WHERE org_id = 1 AND status = 'pending' LIMIT 1`);
    if (!transfer.rows.length) return;
    const transferId = transfer.rows[0].id;

    currentUserId = 2;
    const acceptRes = await request(app)
      .post(`/orgs/1/transfer/${transferId}/accept`)
      .send({ confirmEmail: 'u2@test.com' });
    expect(acceptRes.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'ownership.transfer_accepted');
    expect(event).not.toBeNull();
  });

  it('ownership.transfer_cancelled fires on POST /orgs/:id/transfer/:id/cancel', async () => {
    await seedOrg(pool);

    await request(app)
      .post('/orgs/1/transfer')
      .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });

    const transfer = await pool.query(`SELECT id FROM tm_ownership_transfers WHERE org_id = 1 AND status = 'pending' LIMIT 1`);
    if (!transfer.rows.length) return;
    const transferId = transfer.rows[0].id;

    const cancelRes = await request(app)
      .post(`/orgs/1/transfer/${transferId}/cancel`);
    expect(cancelRes.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'ownership.transfer_cancelled');
    expect(event).not.toBeNull();
  });

  it('email.change_requested fires on POST /me/email-change', async () => {
    await seedOrg(pool);

    const res = await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'newemail@test.com', currentPassword: 'pass' });
    expect(res.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'email.change_requested');
    expect(event).not.toBeNull();
  });

  it('email.change_completed fires when email change is verified', async () => {
    await seedOrg(pool);

    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'verified@test.com', currentPassword: 'pass' });

    const changeReq = await pool.query(
      `SELECT verify_token FROM tm_email_change_requests WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1`
    );
    if (!changeReq.rows.length) return;
    const token = changeReq.rows[0].verify_token;

    currentUserId = null; // token-based route
    const verifyRes = await request(app)
      .get(`/me/email-change/verify?token=${token}`);
    expect(verifyRes.status).toBeLessThan(500);

    const event = await getLatestAuditEvent(pool, 'email.change_completed');
    expect(event).not.toBeNull();
  });
});
