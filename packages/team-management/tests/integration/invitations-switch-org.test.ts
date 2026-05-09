import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Invitations – Switch Org (Sub-A spec)', () => {
  let pool: Pool;
  let app: express.Express;
  let currentUserId: number | null = null;
  let currentOrgId: number | null = null;

  /**
   * Test org topology:
   *   Org 1 (id=1): owner=user1, admin=user2, member=user3, viewer=user4
   *   Org 2 (id=2): owner=user2 (admin acts as owner here), member=user4
   *
   * user3 = member of org 1 only (candidate for switch)
   * user1 = owner of org 1 (blocked from switching)
   * user5 = outsider (no memberships)
   */

  const testAdapter: ServerModuleAdapter = {
    getCurrentUserId: async () => currentUserId,
    getOrganizationIdForUser: async () => currentOrgId,
    // user1 and user2 are admins in their respective orgs
    isUserOrgAdmin: async (userId, orgId) => {
      if (orgId === 1) return userId === 1 || userId === 2;
      if (orgId === 2) return userId === 2;
      return false;
    },
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
        'viewer@test.com': { id: 4, email: 'viewer@test.com' },
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

    // Clean up any prior state
    await pool.query(`DELETE FROM tm_invitations WHERE org_id IN (1, 2)`);
    await pool.query(`DELETE FROM tm_memberships WHERE org_id IN (1, 2)`);
    await pool.query(`DELETE FROM tm_organizations WHERE id IN (1, 2)`);

    // Seed org 1
    await pool.query(
      `INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings) VALUES (1, 'Test Org', 'test-org', 1, '{}')`
    );
    await pool.query(
      `INSERT INTO tm_memberships (org_id, user_id, role) VALUES (1, 1, 'owner'), (1, 2, 'admin'), (1, 3, 'member'), (1, 4, 'viewer')`
    );

    // Seed org 2
    await pool.query(
      `INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings) VALUES (2, 'Second Org', 'second-org', 2, '{}')`
    );
    await pool.query(
      `INSERT INTO tm_memberships (org_id, user_id, role) VALUES (2, 2, 'owner'), (2, 4, 'member')`
    );

    app = express();
    app.use(express.json());
    app.use(serverModule.router);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM tm_invitations WHERE org_id IN (1, 2)`);
    await pool.query(`DELETE FROM tm_memberships WHERE org_id IN (1, 2)`);
    await pool.query(`DELETE FROM tm_organizations WHERE id IN (1, 2)`);
    await pool.end();
  });

  beforeEach(async () => {
    currentUserId = null;
    currentOrgId = null;
    await pool.query(`DELETE FROM tm_invitations WHERE org_id IN (1, 2)`);
    // Reset user3's membership — only in org 1
    await pool.query(`DELETE FROM tm_memberships WHERE user_id = 3 AND org_id = 2`);
    await pool.query(`DELETE FROM tm_memberships WHERE user_id = 3 AND org_id = 1`);
    await pool.query(
      `INSERT INTO tm_memberships (org_id, user_id, role) VALUES (1, 3, 'member')`
    );
  });

  it('User 3 (member of org 1) invited to org 2 → accept returns 409 with requiresOrgSwitch', async () => {
    // Admin of org 2 creates invite for member@test.com
    currentUserId = 2;
    currentOrgId = 2;

    const createRes = await request(app)
      .post('/orgs/2/invitations')
      .send({ email: 'member@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;
    expect(token).toBeDefined();

    // User 3 tries to accept — they're a member of org 1, switching required
    currentUserId = 3;
    currentOrgId = 1;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}`)
      .send({});

    expect(acceptRes.status).toBe(409);
    expect(acceptRes.body.requiresOrgSwitch).toBe(true);
  });

  it('User 3 accepts with ?confirmSwitch=true → atomically removed from org 1, joined org 2', async () => {
    currentUserId = 2;
    currentOrgId = 2;

    const createRes = await request(app)
      .post('/orgs/2/invitations')
      .send({ email: 'member@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;

    // User 3 confirms the org switch
    currentUserId = 3;
    currentOrgId = 1;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}?confirmSwitch=true`)
      .send({});

    expect(acceptRes.status).toBe(200);

    // Verify user3 is NOT in org 1 anymore
    const org1Row = await pool.query(
      `SELECT * FROM tm_memberships WHERE org_id = 1 AND user_id = 3`
    );
    expect(org1Row.rows.length).toBe(0);

    // Verify user3 IS in org 2
    const org2Row = await pool.query(
      `SELECT * FROM tm_memberships WHERE org_id = 2 AND user_id = 3`
    );
    expect(org2Row.rows.length).toBe(1);
    expect(org2Row.rows[0].role).toBe('member');
  });

  it('User 1 (owner of org 1) invited to org 2 → accept returns 422 with ownerBlockedFromSwitch', async () => {
    // Admin of org 2 invites the owner of org 1
    currentUserId = 2;
    currentOrgId = 2;

    const createRes = await request(app)
      .post('/orgs/2/invitations')
      .send({ email: 'owner@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;
    expect(token).toBeDefined();

    // User 1 (owner of org 1) tries to accept
    currentUserId = 1;
    currentOrgId = 1;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}`)
      .send({});

    expect(acceptRes.status).toBe(422);
    expect(acceptRes.body.ownerBlockedFromSwitch).toBe(true);
  });

  it('User 1 with confirmSwitch=true still blocked because they are org owner → 422', async () => {
    currentUserId = 2;
    currentOrgId = 2;

    const createRes = await request(app)
      .post('/orgs/2/invitations')
      .send({ email: 'owner@test.com', role: 'member' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;

    // Owner tries to force confirm switch
    currentUserId = 1;
    currentOrgId = 1;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}?confirmSwitch=true`)
      .send({});

    expect(acceptRes.status).toBe(422);
    expect(acceptRes.body.ownerBlockedFromSwitch).toBe(true);

    // Verify user1 is still in org 1 as owner
    const org1Row = await pool.query(
      `SELECT * FROM tm_memberships WHERE org_id = 1 AND user_id = 1`
    );
    expect(org1Row.rows.length).toBe(1);
    expect(org1Row.rows[0].role).toBe('owner');
  });

  it('User with no existing org (outsider/user5) can join org 2 directly without switch warning', async () => {
    currentUserId = 2;
    currentOrgId = 2;

    const createRes = await request(app)
      .post('/orgs/2/invitations')
      .send({ email: 'outsider@test.com', role: 'viewer' });
    expect(createRes.status).toBe(201);
    const inviteId = createRes.body.id;

    const tokenRow = await pool.query(
      `SELECT token FROM tm_invitations WHERE id = $1`,
      [inviteId]
    );
    const token = tokenRow.rows[0]?.token;

    // Outsider has no org — no switch required
    currentUserId = 5;
    currentOrgId = null;

    const acceptRes = await request(app)
      .post(`/invitations/accept/${token}`)
      .send({});

    // Should be 200 (no org switch needed)
    expect(acceptRes.status).toBe(200);

    const org2Row = await pool.query(
      `SELECT * FROM tm_memberships WHERE org_id = 2 AND user_id = 5`
    );
    expect(org2Row.rows.length).toBe(1);
    expect(org2Row.rows[0].role).toBe('viewer');

    // Clean up
    await pool.query(`DELETE FROM tm_memberships WHERE org_id = 2 AND user_id = 5`);
  });
});
