import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import {
  runMigrations,
  seedStandardConsents,
  createConsentModule,
} from '../../src/server/index.js';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

let pool: Pool;
let consent: ReturnType<typeof createConsentModule>;

describeWithDb('@varshylinc/onboarding-consent-engine — integration', () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Migrations already applied by global-setup; seed again is idempotent
    await seedStandardConsents(pool, 'TestProduct');
    consent = createConsentModule({ pool });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('runMigrations is idempotent — second call skips all', async () => {
    const { applied, skipped } = await runMigrations(pool);
    expect(applied).toHaveLength(0);
    expect(skipped).toHaveLength(4);
  });

  it('oce_consent_definitions has 4 standard rows after seed', async () => {
    const result = await pool.query('SELECT COUNT(*) FROM oce_consent_definitions');
    expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(4);
  });

  it('recordSignupConsents inserts records for all provided keys', async () => {
    const userId = `test-user-${Date.now()}`;
    const records = await consent.recordSignupConsents({
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'privacy_policy', granted: true },
        { key: 'marketing_emails', granted: false },
      ],
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    expect(records).toHaveLength(3);
    expect(records.every((r) => r.user_id === userId)).toBe(true);
  });

  it('hasUserConsented returns true for granted key', async () => {
    const userId = `huc-${Date.now()}`;
    await consent.recordSignupConsents({
      userId,
      consents: [{ key: 'privacy_policy', granted: true }],
    });
    expect(await consent.hasUserConsented(userId, 'privacy_policy')).toBe(true);
  });

  it('hasUserConsented returns false for un-consented key', async () => {
    const userId = `huc2-${Date.now()}`;
    expect(await consent.hasUserConsented(userId, 'terms_of_service')).toBe(false);
  });

  it('needsConsentUpdate returns required definitions for new user', async () => {
    const userId = `ncu-${Date.now()}`;
    const pending = await consent.needsConsentUpdate(userId);
    // terms_of_service and privacy_policy are required
    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(pending.every((d) => d.required)).toBe(true);
  });

  it('needsConsentUpdate returns empty after user consents to all required', async () => {
    const userId = `ncu2-${Date.now()}`;
    await consent.recordSignupConsents({
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'privacy_policy', granted: true },
      ],
    });
    const pending = await consent.needsConsentUpdate(userId);
    expect(pending).toHaveLength(0);
  });

  it('getAuditTrail returns all events newest-first', async () => {
    const userId = `audit-${Date.now()}`;
    await consent.recordSignupConsents({
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'marketing_emails', granted: false },
      ],
    });
    const trail = await consent.getAuditTrail(userId);
    expect(trail.length).toBeGreaterThanOrEqual(2);
    expect(trail[0].user_id).toBe(userId);
  });

  it('getCurrentConsents returns latest state per key', async () => {
    const userId = `cc-${Date.now()}`;
    await consent.recordSignupConsents({
      userId,
      consents: [
        { key: 'terms_of_service', granted: true },
        { key: 'privacy_policy', granted: true },
      ],
    });
    const statuses = await consent.getCurrentConsents(userId);
    expect(statuses.length).toBeGreaterThanOrEqual(2);
    expect(statuses.every((s) => s.granted === true)).toBe(true);
  });

  it('getUserLatestConsents returns a map keyed by user_id', async () => {
    const uid1 = `bulk-a-${Date.now()}`;
    const uid2 = `bulk-b-${Date.now()}`;
    await Promise.all([
      consent.recordSignupConsents({
        userId: uid1,
        consents: [{ key: 'terms_of_service', granted: true }],
      }),
      consent.recordSignupConsents({
        userId: uid2,
        consents: [{ key: 'privacy_policy', granted: true }],
      }),
    ]);
    const map = await consent.getUserLatestConsents([uid1, uid2]);
    expect(map.has(uid1)).toBe(true);
    expect(map.has(uid2)).toBe(true);
    expect(map.get(uid1)!.some((s) => s.key === 'terms_of_service')).toBe(true);
  });

  it('recordSignupConsents throws for unknown consent key', async () => {
    await expect(
      consent.recordSignupConsents({
        userId: 'err-user',
        consents: [{ key: 'nonexistent_key', granted: true }],
      }),
    ).rejects.toThrow('Unknown consent key: nonexistent_key');
  });

  it('onConsentRecorded adapter hook is called', async () => {
    const calls: Array<{ userId: string; key: string; granted: boolean }> = [];
    const tracked = createConsentModule({
      pool,
      adapter: {
        onConsentRecorded(userId, key, granted) {
          calls.push({ userId, key, granted });
        },
      },
    });
    const userId = `hook-${Date.now()}`;
    await tracked.recordSignupConsents({
      userId,
      consents: [{ key: 'terms_of_service', granted: true }],
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ userId, key: 'terms_of_service', granted: true });
  });
});
