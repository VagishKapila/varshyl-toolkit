import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

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

describeWithDb('cascade preview', () => {
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

  it('returns cascade preview for member who has sent invitations', async () => {
    // Member 2 sends an invitation — insert directly with correct column names
    await pool.query(
      `INSERT INTO tm_invitations (org_id, invited_by_user_id, email, role, token_hash, code_encrypted, expires_at)
       VALUES (1, 2, 'invited@example.com', 'member', $1, 'fake-enc-abc123', NOW() + INTERVAL '7 days')`,
      [sha256('tok-abc123')]
    );

    currentUserId = 1; // admin calling on behalf

    const res = await request(app)
      .get('/orgs/1/members/2/cascade-preview');

    expect(res.status).toBeLessThan(500);
    expect(res.body).toBeDefined();

    // Must include the membership being removed
    const body = res.body;
    expect(body).toHaveProperty('membership');

    // Must include pending invitations they sent
    expect(body).toHaveProperty('pendingInvitations');
    const invitations = body.pendingInvitations as Array<{ invited_by_user_id?: number; invitedByUserId?: number }>;
    expect(Array.isArray(invitations)).toBe(true);
    expect(invitations.length).toBeGreaterThanOrEqual(1);
  });

  it('returns cascade preview for member who has NOT sent invitations', async () => {
    // Member 4 has no invitations
    const res = await request(app)
      .get('/orgs/1/members/4/cascade-preview');

    expect(res.status).toBeLessThan(500);
    expect(res.body).toBeDefined();

    const body = res.body;
    expect(body).toHaveProperty('membership');
    expect(body).toHaveProperty('pendingInvitations');

    const invitations = body.pendingInvitations as unknown[];
    expect(Array.isArray(invitations)).toBe(true);
    expect(invitations.length).toBe(0);
  });

  it('returns 404 for non-existent member', async () => {
    const res = await request(app)
      .get('/orgs/1/members/999/cascade-preview');

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin caller', async () => {
    currentUserId = 3; // member, not admin
    const res = await request(app)
      .get('/orgs/1/members/4/cascade-preview');

    expect(res.status).toBe(403);
  });

  it('preview for member with multiple pending invitations lists all of them', async () => {
    await pool.query(
      `INSERT INTO tm_invitations (org_id, invited_by_user_id, email, role, token_hash, code_encrypted, expires_at)
       VALUES
         (1, 2, 'a@example.com', 'member', $1, 'fake-enc-001', NOW() + INTERVAL '7 days'),
         (1, 2, 'b@example.com', 'viewer', $2, 'fake-enc-002', NOW() + INTERVAL '7 days'),
         (1, 2, 'c@example.com', 'admin', $3, 'fake-enc-003', NOW() + INTERVAL '7 days')`,
      [sha256('tok-001'), sha256('tok-002'), sha256('tok-003')]
    );

    const res = await request(app)
      .get('/orgs/1/members/2/cascade-preview');

    expect(res.status).toBeLessThan(500);
    const invitations = res.body.pendingInvitations as unknown[];
    expect(invitations.length).toBe(3);
  });
});
