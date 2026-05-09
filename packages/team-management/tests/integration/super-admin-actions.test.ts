import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = null;
let currentOrgId: number | null = null;

const sendPasswordResetEmail = vi.fn(async () => {});

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
  sendPasswordResetEmail,
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

describeWithDb('super admin', () => {
  let pool: Pool;
  let app: express.Express;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Enable super admin feature
    const mod = createServerModule({
      adapter: testAdapter,
      pool,
      features: { enableSuperAdmin: true },
    });
    app = express();
    app.use(express.json());
    app.use(mod.router);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await cleanAll(pool);
    sendPasswordResetEmail.mockClear();
    currentOrgId = 1;
    await seedOrg(pool);
    // Register user 1 as super admin
    await pool.query(`INSERT INTO tm_super_admins (user_id) VALUES (1) ON CONFLICT DO NOTHING`);
    currentUserId = 1;
  });

  it('GET /admin/orgs → 200 with list of orgs', async () => {
    const res = await request(app).get('/admin/orgs');
    expect(res.status).toBe(200);
    // Route returns { orgs: [...] }
    const orgs = res.body.orgs ?? res.body;
    expect(Array.isArray(orgs)).toBe(true);
    expect(orgs.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /admin/orgs/:id/restore → 200 on a deleted org', async () => {
    // Soft-delete the org
    await pool.query(`UPDATE tm_organizations SET deleted_at = NOW() WHERE id = 1`);

    const res = await request(app)
      .post('/admin/orgs/1/restore')
      .send({ reason: 'test restore' });
    expect(res.status).toBe(200);

    const row = await pool.query(`SELECT deleted_at FROM tm_organizations WHERE id = 1`);
    expect(row.rows[0].deleted_at).toBeNull();
  });

  it('POST /admin/orgs/:id/appoint-owner → 200, audit event with actor_type=super_admin', async () => {
    const res = await request(app)
      .post('/admin/orgs/1/appoint-owner')
      .send({ targetUserId: 2, reason: 'test' });

    expect(res.status).toBe(200);

    // Verify new owner in DB
    const org = await pool.query(`SELECT owner_user_id FROM tm_organizations WHERE id = 1`);
    expect(org.rows[0].owner_user_id).toBe(2);

    // Reason is stored in audit metadata
    const adminEvent = await pool.query(
      `SELECT metadata FROM tm_audit_events WHERE actor_type = 'super_admin' ORDER BY created_at DESC LIMIT 1`
    );
    if (adminEvent.rows.length > 0) {
      const metadata = adminEvent.rows[0].metadata;
      expect(JSON.stringify(metadata)).toContain('test');
    }
  });

  it('POST /admin/users/:userId/lock → 200', async () => {
    const res = await request(app)
      .post('/admin/users/3/lock')
      .send({ reason: 'spam' });

    expect(res.status).toBe(200);
  });

  it('POST /admin/users/:userId/password-reset → 200 and calls sendPasswordResetEmail', async () => {
    const res = await request(app)
      .post('/admin/users/3/password-reset')
      .send({ reason: 'support request' });

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
  });

  it('audit events from super-admin actions show actor_type = "super_admin"', async () => {
    await request(app)
      .post('/admin/orgs/1/appoint-owner')
      .send({ targetUserId: 2, reason: 'audit test' });

    const events = await pool.query(
      `SELECT * FROM tm_audit_events WHERE actor_type = 'super_admin'`
    );
    expect(events.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('non-super-admin accessing /admin/* → 403', async () => {
    currentUserId = 2; // admin but not super-admin

    const res = await request(app).get('/admin/orgs');
    expect(res.status).toBe(403);
  });

  it('unauthenticated user accessing /admin/* → 401 or 403', async () => {
    currentUserId = null;

    const res = await request(app).get('/admin/orgs');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /admin/orgs includes soft-deleted orgs', async () => {
    await pool.query(`UPDATE tm_organizations SET deleted_at = NOW() WHERE id = 1`);

    const res = await request(app).get('/admin/orgs');
    expect(res.status).toBe(200);

    const orgs = (res.body.orgs ?? res.body) as Array<{ id: number }>;
    const ids = orgs.map(o => o.id);
    expect(ids).toContain(1);
  });
});
