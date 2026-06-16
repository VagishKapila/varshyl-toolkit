import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import {
  grantAccess,
  hasGrantedAccess,
  redeemPromoCode,
  revokeAccess,
} from '../../src/server/grants.js';

function createMockDb(queryImpl: (...args: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>) {
  const query = vi.fn(queryImpl);
  const client = { query, release: vi.fn() };
  return {
    query,
    connect: vi.fn(async () => client),
  } as unknown as Pool;
}

describe('grants server functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hasGrantedAccess → true when active permanent grant', async () => {
    const db = createMockDb(async () => ({ rows: [{ ok: 1 }] }));
    await expect(hasGrantedAccess(db, 'user-1', 'my-app')).resolves.toBe(true);
  });

  it('hasGrantedAccess → false when no grant', async () => {
    const db = createMockDb(async () => ({ rows: [] }));
    await expect(hasGrantedAccess(db, 'user-1', 'my-app')).resolves.toBe(false);
  });

  it('hasGrantedAccess → false when revoked', async () => {
    const db = createMockDb(async () => ({ rows: [] }));
    await expect(hasGrantedAccess(db, 'user-revoked', 'my-app')).resolves.toBe(false);
  });

  it('hasGrantedAccess → false when expired', async () => {
    const db = createMockDb(async () => ({ rows: [] }));
    await expect(hasGrantedAccess(db, 'user-expired', 'my-app')).resolves.toBe(false);
  });

  it('grantAccess → creates record', async () => {
    const db = createMockDb(async () => ({
      rows: [{
        id: 'grant-1',
        user_id: 'user-1',
        product_slug: 'my-app',
        granted_by: 'admin-1',
        reason: 'beta',
        expires_at: null,
        revoked_at: null,
        created_at: new Date().toISOString(),
      }],
    }));
    const record = await grantAccess(db, {
      userId: 'user-1',
      productSlug: 'my-app',
      grantedBy: 'admin-1',
      reason: 'beta',
    });
    expect(record.userId).toBe('user-1');
    expect(record.productSlug).toBe('my-app');
  });

  it('revokeAccess → sets revoked_at, returns true', async () => {
    const db = createMockDb(async () => ({ rows: [], rowCount: 1 }));
    await expect(revokeAccess(db, 'user-1', 'my-app')).resolves.toBe(true);
  });

  it('revokeAccess → returns false if nothing to revoke', async () => {
    const db = createMockDb(async () => ({ rows: [], rowCount: 0 }));
    await expect(revokeAccess(db, 'user-1', 'my-app')).resolves.toBe(false);
  });

  it('redeemPromoCode → success on valid code', async () => {
    let call = 0;
    const db = createMockDb(async (sql: unknown) => {
      call += 1;
      const text = String(sql);
      if (text === 'BEGIN') return { rows: [] };
      if (text.includes('FROM mp_promo_codes')) {
        return {
          rows: [{
            id: 'code-1',
            code: 'BETA',
            uses: 0,
            max_uses: 10,
            expires_at: null,
            grants_permanent: true,
            grants_days: null,
          }],
        };
      }
      if (text.includes('mp_promo_redemptions')) return { rows: [] };
      if (text === 'COMMIT') return { rows: [] };
      return { rows: [], rowCount: 1 };
    });
    await expect(redeemPromoCode(db, 'BETA', 'user-1', 'my-app')).resolves.toEqual({ success: true });
    expect(call).toBeGreaterThan(3);
  });

  it('redeemPromoCode → fails if already redeemed', async () => {
    const db = createMockDb(async (sql: unknown) => {
      const text = String(sql);
      if (text === 'BEGIN') return { rows: [] };
      if (text.includes('FROM mp_promo_codes')) {
        return { rows: [{ id: 'code-1', code: 'BETA', uses: 1, max_uses: 10, expires_at: null, grants_permanent: true }] };
      }
      if (text.includes('mp_promo_redemptions')) return { rows: [{ id: 'red-1' }] };
      if (text === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });
    await expect(redeemPromoCode(db, 'BETA', 'user-1', 'my-app')).resolves.toEqual({
      success: false,
      reason: 'already_redeemed',
    });
  });

  it('redeemPromoCode → fails if code expired', async () => {
    const db = createMockDb(async (sql: unknown) => {
      const text = String(sql);
      if (text === 'BEGIN') return { rows: [] };
      if (text.includes('FROM mp_promo_codes')) {
        return {
          rows: [{
            id: 'code-1',
            code: 'OLD',
            uses: 0,
            max_uses: null,
            expires_at: new Date('2020-01-01').toISOString(),
            grants_permanent: true,
          }],
        };
      }
      if (text === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });
    await expect(redeemPromoCode(db, 'OLD', 'user-1', 'my-app')).resolves.toEqual({
      success: false,
      reason: 'code_expired',
    });
  });
});
