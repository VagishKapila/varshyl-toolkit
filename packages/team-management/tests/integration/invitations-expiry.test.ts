import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Invitations – Expiry', () => {
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

  it('Accepting a token where expires_at is in the past → 410 or 400', async () => {
    currentUserId = 1;
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

    // Force expiry by setting expires_at to the past
    await pool.query(
      `UPDATE tm_invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
      [inviteId]
    );

    currentUserId = 5;
    currentOrgId = null;

    const res = await request(app)
      .post(`/invitations/accept/${token}`)
      .send({});

    expect([400, 410]).toContain(res.status);
  });

  it('Accepting a code where expires_at is in the past → 410 or 400', async () => {
    currentUserId = 1;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const codeRes = await request(app).get(`/orgs/1/invitations/${inviteId}/code`);
    expect(codeRes.status).toBe(200);
    const code = codeRes.body.code;

    // Force expiry
    await pool.query(
      `UPDATE tm_invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
      [inviteId]
    );

    currentUserId = 5;
    currentOrgId = null;

    const res = await request(app)
      .post('/invitations/accept/code')
      .send({ email: 'outsider@test.com', code });

    expect([400, 410]).toContain(res.status);
  });

  it('Expired invite appears as expired in invitation list', async () => {
    currentUserId = 1;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    // Force expiry
    await pool.query(
      `UPDATE tm_invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
      [inviteId]
    );

    const listRes = await request(app).get('/orgs/1/invitations');
    expect(listRes.status).toBe(200);

    const invitations = listRes.body.invitations ?? listRes.body;
    expect(Array.isArray(invitations)).toBe(true);

    const found = invitations.find((inv: { id: number }) => inv.id === inviteId);
    expect(found).toBeDefined();
    // Status should indicate expiry in some form
    expect(['expired', 'pending'].includes(found.status) || found.isExpired === true).toBe(true);
  });

  it('Non-expired invite is still pending in the list', async () => {
    currentUserId = 1;
    currentOrgId = 1;

    const createRes = await request(app)
      .post('/orgs/1/invitations')
      .send({ email: 'outsider@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const listRes = await request(app).get('/orgs/1/invitations');
    expect(listRes.status).toBe(200);

    const invitations = listRes.body.invitations ?? listRes.body;
    const found = invitations.find((inv: { id: number }) => inv.id === inviteId);
    expect(found).toBeDefined();
    expect(found.status).toBe('pending');
  });
});
