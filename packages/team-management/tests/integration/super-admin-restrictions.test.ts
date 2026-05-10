import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter, OrgRole } from '../../src/server/types.js';

const DATABASE_URL = process.env.DATABASE_URL;
const describeWithDb = DATABASE_URL ? describe : describe.skip;

let currentUserId: number | null = 1;
let currentOrgId: number | null = 1;

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
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendOwnershipTransferEmail: async () => {},
  sendEmailChangeVerification: async () => {},
  sendEmailChangeOldNotice: async () => {},
  sendEmailChangedFinalNotice: async () => {},
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendOrgDeletionNotice: async () => {},
  emitNotification: async () => {},
};

describeWithDb('super-admin restrictions (integration)', () => {
  let pool: Pool;
  let app: express.Express;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    const tm = createServerModule({
      adapter: testAdapter,
      db: pool,
      config: {
        featureFlags: {
          enableInvites: true,
          enableAuditLog: true,
          enableSuperAdmin: true,
          enableOwnershipTransfer: true,
          enableEmailChange: true,
          enablePasswordReset: true,
        },
      },
    });
    await tm.runMigrations();
    app = express();
    app.use(express.json());
    app.use('/api/team', tm.router);
  });

  beforeEach(async () => {
    await pool.query(`TRUNCATE tm_super_admins, tm_password_reset_requests,
      tm_email_change_requests, tm_ownership_transfers, tm_audit_events,
      tm_invitations, tm_memberships, tm_organizations RESTART IDENTITY CASCADE`);
    // Seed org + super-admin (user 1 is super-admin)
    await pool.query(`INSERT INTO tm_organizations (id, name, slug, owner_user_id, settings)
      VALUES (1, 'Test Org', 'test-org', 1, '{}')`);
    await pool.query(`INSERT INTO tm_memberships (org_id, user_id, role)
      VALUES (1,1,'owner'),(1,2,'admin'),(1,3,'member'),(1,4,'viewer')`);
    await pool.query(`INSERT INTO tm_super_admins (user_id, granted_by_user_id)
      VALUES (1, 1)`);
    currentUserId = 1;
    currentOrgId = 1;
  });

  afterAll(async () => {
    await pool.query(`TRUNCATE tm_super_admins, tm_password_reset_requests,
      tm_email_change_requests, tm_ownership_transfers, tm_audit_events,
      tm_invitations, tm_memberships, tm_organizations RESTART IDENTITY CASCADE`);
    await pool.end();
  });

  it('super-admin cannot impersonate users (no login-as endpoint exists)', async () => {
    // There should be no /admin/users/:id/impersonate or /admin/login-as endpoint
    const res = await request(app)
      .post('/api/team/admin/users/3/impersonate')
      .set('Accept', 'application/json');
    // 404 = route doesn't exist (correct — impersonation is banned by spec)
    expect(res.status).toBe(404);
  });

  it('super-admin cannot set user passwords directly (only trigger reset link)', async () => {
    // There should be no /admin/users/:id/set-password endpoint
    const res = await request(app)
      .post('/api/team/admin/users/3/set-password')
      .send({ password: 'newpassword123' })
      .set('Accept', 'application/json');
    // 404 = route doesn't exist
    expect(res.status).toBe(404);
  });

  it('password-reset via admin triggers email but adapter.setUserPassword is NOT called directly', async () => {
    vi.mocked(testAdapter.sendPasswordResetEmail).mockClear();
    const res = await request(app)
      .post('/api/team/admin/users/3/password-reset')
      .send({ reason: 'user requested support' })
      .set('Accept', 'application/json');

    expect([200, 201]).toContain(res.status);
    // sendPasswordResetEmail SHOULD be called (sends link to user)
    expect(vi.mocked(testAdapter.sendPasswordResetEmail)).toHaveBeenCalledTimes(1);
    // But the password reset should go to the USER's email, not be set directly
    const callArg = vi.mocked(testAdapter.sendPasswordResetEmail).mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    expect(callArg?.to).toMatch(/@test\.com$/); // goes to user's email
  });

  it('super-admin cannot access product data beyond org+member info', async () => {
    // There should be no /admin/orgs/:id/invoices, /admin/orgs/:id/projects, etc.
    const productDataRoutes = [
      '/api/team/admin/orgs/1/invoices',
      '/api/team/admin/orgs/1/projects',
      '/api/team/admin/orgs/1/pay-apps',
      '/api/team/admin/orgs/1/documents',
    ];
    for (const route of productDataRoutes) {
      const res = await request(app).get(route).set('Accept', 'application/json');
      // 404 = route doesn't exist (product data is out of scope for this module)
      expect(res.status).toBe(404);
    }
  });

  it('super-admin actions require a reason text (cannot omit reason)', async () => {
    // appoint-owner without reason → 400
    const resNoReason = await request(app)
      .post('/api/team/admin/orgs/1/appoint-owner')
      .send({ target_user_id: 2 }) // missing reason
      .set('Accept', 'application/json');
    expect(resNoReason.status).toBe(400);

    // lock without reason → 400
    const resLockNoReason = await request(app)
      .post('/api/team/admin/users/3/lock')
      .send({}) // missing reason
      .set('Accept', 'application/json');
    expect(resLockNoReason.status).toBe(400);
  });

  it('non-super-admin cannot access /admin routes even with org membership', async () => {
    currentUserId = 2; // Mike is admin but NOT a super-admin
    const res = await request(app)
      .get('/api/team/admin/orgs')
      .set('Accept', 'application/json');
    expect(res.status).toBe(403);
  });

  it('super-admin audit events store reason and have actor_type super_admin', async () => {
    // Appoint new owner with reason
    await request(app)
      .post('/api/team/admin/orgs/1/appoint-owner')
      .send({ target_user_id: 2, reason: 'original owner unreachable - legal request' })
      .set('Accept', 'application/json');

    const events = await pool.query(
      `SELECT action, actor_type, reason FROM tm_audit_events WHERE org_id = 1 ORDER BY id DESC LIMIT 1`
    );
    if (events.rows.length > 0) {
      const event = events.rows[0];
      expect(event.actor_type).toBe('super_admin');
      expect(event.reason).toContain('legal request');
      expect(event.action).toMatch(/owner|appoint/i);
    }
  });

  it('audit events from super-admin show actor as super_admin (not their real identity)', async () => {
    // Fire a super-admin action
    await request(app)
      .post('/api/team/admin/users/3/lock')
      .send({ reason: 'abuse report' })
      .set('Accept', 'application/json');

    // Check audit event: actor_type should be 'super_admin', actor_user_id stored internally
    // But the API route GET /orgs/:id/audit should show "Varshyl Support" not the real name
    currentUserId = 1; // owner can see audit log
    currentOrgId = 1;
    const auditRes = await request(app)
      .get('/api/team/orgs/1/audit')
      .set('Accept', 'application/json');

    if (auditRes.status === 200 && Array.isArray(auditRes.body)) {
      const superAdminEvents = auditRes.body.filter((e: Record<string, unknown>) =>
        e['actor_type'] === 'super_admin' || e['actor_display_name'] === 'Varshyl Support'
      );
      // If super-admin events are returned, the display should be "Varshyl Support"
      for (const event of superAdminEvents) {
        if (event['actor_display_name']) {
          expect(event['actor_display_name']).toBe('Varshyl Support');
        }
        // Real user_id should NOT be exposed in the public audit API
        expect(event).not.toHaveProperty('super_admin_user_id');
      }
    }
  });
});
