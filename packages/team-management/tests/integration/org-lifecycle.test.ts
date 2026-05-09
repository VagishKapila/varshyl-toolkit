import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

const sendOrgDeletionNotice = vi.fn(async () => {});

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
  sendOrgDeletionNotice,
  emitNotification: async () => {},
};

async function cleanAll(pool: Pool) {
  await pool.query(`TRUNCATE tm_super_admins, tm_password_reset_requests,
    tm_email_change_requests, tm_ownership_transfers, tm_audit_events,
    tm_invitations, tm_memberships, tm_organizations RESTART IDENTITY CASCADE`);
}

describeWithDb('org lifecycle integration', () => {
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
    sendOrgDeletionNotice.mockClear();
    currentUserId = 1;
    currentOrgId = null;
  });

  it('POST /orgs creates an organization', async () => {
    const res = await request(app)
      .post('/orgs')
      .send({ name: 'Test Org', slug: 'test-org' });

    expect(res.status).toBe(201);
    // Response shape is { org: { id, name, ... } }
    expect(res.body.org).toHaveProperty('id');
    expect(res.body.org.name).toBe('Test Org');

    const dbRow = await pool.query(`SELECT * FROM tm_organizations WHERE slug = 'test-org'`);
    expect(dbRow.rows.length).toBe(1);
    expect(dbRow.rows[0].owner_user_id).toBe(1);
  });

  it('PATCH /orgs/:id updates name', async () => {
    const createRes = await request(app)
      .post('/orgs')
      .send({ name: 'Settings Org', slug: 'settings-org' });
    expect(createRes.status).toBe(201);
    const orgId = createRes.body.org.id;
    currentOrgId = orgId;

    const res = await request(app)
      .patch(`/orgs/${orgId}`)
      .send({ name: 'Settings Org Updated' });

    expect(res.status).toBe(200);

    const dbRow = await pool.query(`SELECT name FROM tm_organizations WHERE id = $1`, [orgId]);
    expect(dbRow.rows[0].name).toBe('Settings Org Updated');
  });

  it('DELETE /orgs/:id soft-deletes with name confirmation', async () => {
    const orgName = 'Delete Me Org';
    const createRes = await request(app)
      .post('/orgs')
      .send({ name: orgName, slug: 'delete-me-org' });
    expect(createRes.status).toBe(201);
    const orgId = createRes.body.org.id;
    currentOrgId = orgId;

    // Wrong name → rejected (422)
    const badRes = await request(app)
      .delete(`/orgs/${orgId}`)
      .send({ confirmOrgName: 'Wrong Name' });
    expect(badRes.status).toBe(422);

    // Correct name → accepted
    const res = await request(app)
      .delete(`/orgs/${orgId}`)
      .send({ confirmOrgName: orgName });
    expect(res.status).toBe(200);
  });

  it('soft-deleted org is hidden from normal reads', async () => {
    const createRes = await request(app)
      .post('/orgs')
      .send({ name: 'Hidden Org', slug: 'hidden-org' });
    const orgId = createRes.body.org.id;
    currentOrgId = orgId;

    await request(app).delete(`/orgs/${orgId}`).send({ confirmOrgName: 'Hidden Org' });

    const getRes = await request(app).get(`/orgs/${orgId}`);
    // requireMembership returns 403 for deleted org (member/org join filters deleted_at)
    // getOrg returns null (filters deleted_at) → 404 if middleware passes
    // Either is acceptable — the org is hidden
    expect([403, 404]).toContain(getRes.status);
  });

  it('soft-deleted org still exists in DB with deleted_at set', async () => {
    const createRes = await request(app)
      .post('/orgs')
      .send({ name: 'DB Org', slug: 'db-org' });
    const orgId = createRes.body.org.id;
    currentOrgId = orgId;

    await request(app).delete(`/orgs/${orgId}`).send({ confirmOrgName: 'DB Org' });

    const dbRow = await pool.query(`SELECT * FROM tm_organizations WHERE id = $1`, [orgId]);
    expect(dbRow.rows.length).toBe(1);
    expect(dbRow.rows[0].deleted_at).not.toBeNull();
  });

  it('all members are notified when org is deleted', async () => {
    const createRes = await request(app)
      .post('/orgs')
      .send({ name: 'Notify Org', slug: 'notify-org' });
    const orgId = createRes.body.org.id;
    currentOrgId = orgId;

    // Add some members
    await pool.query(`INSERT INTO tm_memberships (org_id, user_id, role) VALUES ($1, 2, 'admin'), ($1, 3, 'member') ON CONFLICT DO NOTHING`, [orgId]);

    await request(app).delete(`/orgs/${orgId}`).send({ confirmOrgName: 'Notify Org' });

    expect(sendOrgDeletionNotice).toHaveBeenCalled();
  });
});
