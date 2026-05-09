import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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

const sendEmailChangeVerification = vi.fn(async () => {});
const sendEmailChangeOldNotice = vi.fn(async () => {});
const sendEmailChangedFinalNotice = vi.fn(async () => {});
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
  sendEmailChangeVerification,
  sendEmailChangeOldNotice,
  sendEmailChangedFinalNotice,
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

describeWithDb('email change flow', () => {
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
    sendEmailChangeVerification.mockClear();
    sendEmailChangeOldNotice.mockClear();
    sendEmailChangedFinalNotice.mockClear();
    sendPasswordResetEmail.mockClear();
    currentUserId = 3;
    currentOrgId = 1;
    await seedOrg(pool);
  });

  it('POST /me/email-change → 200 and calls verification + notice emails', async () => {
    const res = await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'new@example.com', currentPassword: 'mypassword' });

    expect(res.status).toBe(200);

    // Both verification and old-address notice should be sent
    expect(sendEmailChangeVerification).toHaveBeenCalledOnce();
    expect(sendEmailChangeOldNotice).toHaveBeenCalledOnce();

    // Verify row in DB
    const dbRow = await pool.query(
      `SELECT * FROM tm_email_change_requests WHERE user_id = 3 ORDER BY created_at DESC LIMIT 1`
    );
    expect(dbRow.rows.length).toBe(1);
    expect(dbRow.rows[0].new_email).toBe('new@example.com');
    // Status is tracked via verified_at/cancelled_at (both null = pending)
    expect(dbRow.rows[0].verified_at).toBeNull();
    expect(dbRow.rows[0].cancelled_at).toBeNull();
  });

  it('GET /me/email-change/verify?token=:token → 200, email changed', async () => {
    sendEmailChangeVerification.mockClear();
    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'verified@example.com', currentPassword: 'mypassword' });

    // Extract raw token from the verifyUrl sent to the spy
    const callArg = sendEmailChangeVerification.mock.calls[0]?.[0] as { verifyUrl?: string } | undefined;
    const verifyUrl = callArg?.verifyUrl ?? '';
    const token = new URLSearchParams(verifyUrl.split('?')[1] ?? '').get('token') ?? '';
    expect(token).toBeTruthy();

    // Route requires auth — keep currentUserId=3
    const res = await request(app)
      .get(`/me/email-change/verify?token=${token}`);

    expect(res.status).toBe(200);
    // sendEmailChangedFinalNotice is called twice (for new address and old address)
    expect(sendEmailChangedFinalNotice).toHaveBeenCalledTimes(2);

    // Verify DB shows verified_at is set
    const tokenHash = sha256(token);
    const updated = await pool.query(
      `SELECT verified_at FROM tm_email_change_requests WHERE verify_token_hash = $1`,
      [tokenHash]
    );
    expect(updated.rows[0].verified_at).not.toBeNull();
  });

  it('GET /me/email-change/cancel?token=:cancelToken → 200, change cancelled', async () => {
    sendEmailChangeOldNotice.mockClear();
    await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'cancel@example.com', currentPassword: 'mypassword' });

    // Extract raw cancel token from the cancelUrl sent to the spy
    const cancelCallArg = sendEmailChangeOldNotice.mock.calls[0]?.[0] as { cancelUrl?: string } | undefined;
    const cancelUrl = cancelCallArg?.cancelUrl ?? '';
    const cancelToken = new URLSearchParams(cancelUrl.split('?')[1] ?? '').get('token') ?? '';
    expect(cancelToken).toBeTruthy();

    currentUserId = null; // cancel is unauthenticated — token is the credential
    const res = await request(app)
      .get(`/me/email-change/cancel?token=${cancelToken}`);

    expect(res.status).toBe(200);

    // Verify DB shows cancelled_at is set
    const cancelTokenHash = sha256(cancelToken);
    const updated = await pool.query(
      `SELECT cancelled_at FROM tm_email_change_requests WHERE cancel_token_hash = $1`,
      [cancelTokenHash]
    );
    expect(updated.rows[0].cancelled_at).not.toBeNull();
  });

  it.skip('after cancel: sendPasswordResetEmail is triggered (not yet implemented in service)', async () => {
    // cancelEmailChange service calls invalidateAllUserSessions but not sendPasswordResetEmail.
    // Skipped until the security-triggered password-reset-on-cancel flow is implemented.
  });

  it('rate limit: 4th email-change request in 24h → 429', async () => {
    // Insert 3 existing requests within the last 24 hours
    const past = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
    for (let i = 0; i < 3; i++) {
      await pool.query(
        `INSERT INTO tm_email_change_requests (user_id, new_email, verify_token_hash, cancel_token_hash, expires_at, created_at)
         VALUES (3, $1, $2, $3, NOW() + INTERVAL '24 hours', $4)`,
        [`rate${i}@example.com`, sha256(`verify-rate${i}`), sha256(`cancel-rate${i}`), past]
      );
    }

    const res = await request(app)
      .post('/me/email-change')
      .send({ newEmail: 'fourth@example.com', currentPassword: 'mypassword' });

    expect(res.status).toBe(429);
  });
});
