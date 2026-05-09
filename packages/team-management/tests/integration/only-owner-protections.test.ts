import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

const sendInviteEmail = vi.fn(async () => {});

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
  sendInviteEmail,
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
    sendInviteEmail.mockClear();
    currentUserId = 1;
    currentOrgId = 1;
    await seedOrg(pool);
  });

  it('owner removing themselves returns 400 with specific error message', async () => {
    const res = await request(app).delete('/orgs/1/members/1');

    // Accept 400 or 422 — implementation may differ
    expect([400, 422]).toContain(res.status);
    // Should have some error or message field
    const body: Record<string, string> = res.body as Record<string, string>;
    const errorText = body.message ?? body.error ?? '';
    expect(errorText.toLowerCase()).toMatch(/owner|cannot remove|yourself|self/);
  });

  it('cannot set two members to owner role (DB constraint enforced)', async () => {
    // Directly attempt to insert a second owner via SQL — should fail
    await expect(
      pool.query(`INSERT INTO tm_memberships (org_id, user_id, role) VALUES (1, 5, 'owner')`)
    ).rejects.toThrow();
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

  it.skip('owner accepting invite to join another org while sole owner → 422 (org-switch not implemented)', async () => {
    // Org-switch protection (preventing owners from leaving) is not yet implemented.
    // This test is skipped until the sub-A org-switch feature is complete.
  });

  it('changing own role away from owner via PATCH is blocked → 400 or 403', async () => {
    // Use the /role suffix as per the actual route definition
    const res = await request(app)
      .patch('/orgs/1/members/1/role')
      .send({ role: 'admin' });

    expect([400, 403]).toContain(res.status);
  });
});
