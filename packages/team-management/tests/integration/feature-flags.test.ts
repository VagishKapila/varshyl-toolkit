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

function buildApp(pool: Pool, features: Record<string, boolean>) {
  const mod = createServerModule({ adapter: testAdapter, pool, features });
  const app = express();
  app.use(express.json());
  app.use(mod.router);
  return app;
}

describeWithDb('feature flags', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
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

  describe('enableInvites = false', () => {
    it('POST /orgs/1/invitations → 501', async () => {
      const app = buildApp(pool, { enableInvites: false });
      const res = await request(app)
        .post('/orgs/1/invitations')
        .send({ email: 'test@example.com', role: 'member' });
      expect(res.status).toBe(501);
    });
  });

  describe('enableAuditLog = false', () => {
    it('GET /orgs/1/audit → 501', async () => {
      const app = buildApp(pool, { enableAuditLog: false });
      const res = await request(app).get('/orgs/1/audit');
      expect(res.status).toBe(501);
    });
  });

  describe('enableOwnershipTransfer = false', () => {
    it('POST /orgs/1/transfer → 501', async () => {
      const app = buildApp(pool, { enableOwnershipTransfer: false });
      const res = await request(app)
        .post('/orgs/1/transfer')
        .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });
      expect(res.status).toBe(501);
    });
  });

  describe('enableEmailChange = false', () => {
    it('POST /me/email-change → 501', async () => {
      const app = buildApp(pool, { enableEmailChange: false });
      const res = await request(app)
        .post('/me/email-change')
        .send({ newEmail: 'new@example.com', currentPassword: 'pass' });
      expect(res.status).toBe(501);
    });
  });

  describe('enablePasswordReset = false', () => {
    it('POST /me/password-reset/request → 501', async () => {
      const app = buildApp(pool, { enablePasswordReset: false });
      currentUserId = null;
      const res = await request(app)
        .post('/me/password-reset/request')
        .send({ email: 'u1@test.com' });
      expect(res.status).toBe(501);
    });
  });

  describe('enableSuperAdmin = false', () => {
    it('GET /admin/orgs → 403, 404, or 501', async () => {
      const app = buildApp(pool, { enableSuperAdmin: false });
      const res = await request(app).get('/admin/orgs');
      // 404 when feature disabled (middleware returns 404 to obscure admin routes)
      // 403 if user not super-admin, 501 if feature check first
      expect([403, 404, 501]).toContain(res.status);
    });
  });

  describe('all flags enabled', () => {
    it('POST /orgs/1/invitations returns non-501', async () => {
      const app = buildApp(pool, {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
      });
      const res = await request(app)
        .post('/orgs/1/invitations')
        .send({ email: 'test@example.com', role: 'member' });
      expect(res.status).not.toBe(501);
    });

    it('GET /orgs/1/audit returns non-501', async () => {
      const app = buildApp(pool, {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
      });
      const res = await request(app).get('/orgs/1/audit');
      expect(res.status).not.toBe(501);
    });

    it('POST /orgs/1/transfer returns non-501', async () => {
      const app = buildApp(pool, {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
      });
      const res = await request(app)
        .post('/orgs/1/transfer')
        .send({ toUserId: 2, confirmOrgName: 'Test Org 1' });
      expect(res.status).not.toBe(501);
    });

    it('POST /me/email-change returns non-501', async () => {
      const app = buildApp(pool, {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
      });
      const res = await request(app)
        .post('/me/email-change')
        .send({ newEmail: 'new@example.com', currentPassword: 'pass' });
      expect(res.status).not.toBe(501);
    });

    it('POST /me/password-reset/request returns non-501', async () => {
      const app = buildApp(pool, {
        enableInvites: true,
        enableAuditLog: true,
        enableOwnershipTransfer: true,
        enableEmailChange: true,
        enablePasswordReset: true,
        enableSuperAdmin: true,
      });
      currentUserId = null;
      const res = await request(app)
        .post('/me/password-reset/request')
        .send({ email: 'u1@test.com' });
      expect(res.status).not.toBe(501);
    });
  });
});
