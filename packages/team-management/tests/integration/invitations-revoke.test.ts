import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Invitations – Revoke', () => {
  let pool: Pool;
  let app: express.Express;
  let currentUserId: number | null = null;
  let currentOrgId: number | null = null;

  const testAdapter: ServerModuleAdapter = {
    getCurrentUserId: async () => currentUserId,
    getOrganizationIdForUser: async () => currentOrgId,
    isUserOrgAdmin: async (userId, _orgId) => userId === 1 || userId === 2,
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    getUserById: async (id) => {
      const users: Record<number, { id: number; email: string; name: string }> = {
        1: { id: 1, email: 'owner@test.com', name: 'Owner' },
        2: { id: 2, email: 'admin@test.com', name: 'Admin' },
        3: { id: 3, email: 'member@test.com', name: 'Member' },
        4: { id: 4, email: 'viewer@test.com', name: 'Viewer' },
        5: { id: 5, email: 'outsider@test.com', name: 'Outsider' },
      };
      return users[id] ?? null;
    },
    getUsersByIds: async (ids) =>
      ids.map((id) => ({ id, email: `user${id}@test.com`, name: `User${id}` })),
    findUserByEmail: async (email) => {
      const map: Record<string, { id: number; email: string }> = {
        'owner@test.com': { id: 1, email: 'owner@test.com' },
        'admin@test.com': { id: 2, email: 'admin@test.com' },
        'member@test.com': { id: 3, email: 'member@test.com' },
        'outsider@test.com': { id: 5, email: 'outsider@test.com' },
        'new@test.com': { id: 6, email: 'new@test.com' },
      };
      return map[email] ?? null;
    },
    createUserFromInvite: async ({ email }: { email: string; orgId: number; role: OrgRole }) => ({
      id: 99,
      email,
    }),
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

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });

    const serverModule = createServerModule(pool, testAdapter, {
      invitations: true,
      memberships: true,
      organizations: true,
    });
    await serverModule.migrate();

    await pool.query(`DELETE FROM tm_memberships WHERE org_id = 1`);
    await pool.query(`DELETE FROM tm_organizations WHERE id = 1`);
    await pool.query(
      `INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings) VALUES (1, 'Test Org', 'test-org', 1, '{}')`
    );
    await pool.query(
      `INSERT INTO tm_memberships (org_id, user_id, role) VALUES (1, 1, 'owner'), (1, 2, 'admin'), (1, 3, 'member'), (1, 4, 'viewer')`
    );

    app = express();
    app.use(express.json());
    app.use(serverModule.router);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM tm_invitations WHERE org_id = 1`);
    await pool.query(`DELETE FROM tm_memberships WHERE org_id = 1`);
    await pool.query(`DELETE FROM tm_organizations WHERE id = 1`);
    await pool.end();
  });

  beforeEach(async () => {
    currentUserId = null;
    currentOrgId = null;
    await pool.query(`DELETE FROM tm_invitations WHERE org_id = 1`);
    await pool.query(`DELETE FROM tm_memberships WHERE org_id = 1 AND user_id = 5`);
  });

  it('POST /orgs/1/invitations as admin creates invite (201)', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const res = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('pending');
  });

  it('DELETE /orgs/1/invitations/:id as admin → 200', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const deleteRes = await request(app).delete(`/orgs/1/invitations/${inviteId}`);
    expect(deleteRes.status).toBe(200);
  });

  it('Accepting a revoked invite by token → 400 or 410', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;
    expect(token).toBeDefined();

    // Revoke
    const deleteRes = await request(app).delete(`/orgs/1/invitations/${inviteId}`);
    expect(deleteRes.status).toBe(200);

    // Try to accept revoked invite
    currentUserId = 5;
    currentOrgId = null;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}`)
      .send({});

    expect([400, 404, 410]).toContain(acceptRes.status);
  });

  it('Accepting a revoked invite by code → 400 or 410', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const codeRes = await request(app).get(`/orgs/1/invitations/${inviteId}/code`);
    expect(codeRes.status).toBe(200);
    const code = codeRes.body.code;

    // Revoke
    const deleteRes = await request(app).delete(`/orgs/1/invitations/${inviteId}`);
    expect(deleteRes.status).toBe(200);

    // Try to accept revoked invite by code
    currentUserId = 5;
    currentOrgId = null;

    const acceptRes = await request(app)
      .post('/invitations/accept/code')
      .send({ email: 'outsider@test.com', code });

    expect([400, 404, 410]).toContain(acceptRes.status);
  });

  it('DELETE /orgs/1/invitations/:id as member (non-admin) → 403', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    // Switch to non-admin member
    currentUserId = 3;
    currentOrgId = 1;

    const deleteRes = await request(app).delete(`/orgs/1/invitations/${inviteId}`);
    expect(deleteRes.status).toBe(403);
  });

  it('Revoked invite no longer appears as pending in list', async () => {
    currentUserId = 2;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    await request(app).delete(`/orgs/1/invitations/${inviteId}`);

    const listRes = await request(app).get('/orgs/1/invitations');
    expect(listRes.status).toBe(200);

    const invitations = listRes.body.invitations ?? listRes.body;
    // After revoke, the invite should either not appear or appear as revoked/cancelled
    const found = invitations.find((inv: { id: number }) => inv.id === inviteId);
    if (found) {
      expect(['revoked', 'cancelled', 'deleted']).toContain(found.status);
    }
    // If not found at all, that's also acceptable (deleted from DB)
  });
});
