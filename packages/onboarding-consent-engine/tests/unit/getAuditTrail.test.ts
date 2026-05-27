import { describe, it, expect, vi } from 'vitest';
import { getAuditTrail } from '../../src/server/lib/getAuditTrail.js';
import type { Pool } from 'pg';

function makePool(rows: object[]): Pool {
  return { query: vi.fn().mockResolvedValue({ rows }) } as unknown as Pool;
}

describe('getAuditTrail', () => {
  it('returns audit entries for a user', async () => {
    const entries = [
      { id: 1, user_id: 'u1', key: 'terms_of_service', version: 1, granted: true },
      { id: 2, user_id: 'u1', key: 'privacy_policy', version: 1, granted: true },
    ];
    const pool = makePool(entries);
    const result = await getAuditTrail(pool, 'u1');
    expect(result).toEqual(entries);
  });

  it('passes limit=50 by default', async () => {
    const pool = makePool([]);
    await getAuditTrail(pool, 'u1');
    const [, params] = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(params[1]).toBe(50);
  });

  it('passes custom limit', async () => {
    const pool = makePool([]);
    await getAuditTrail(pool, 'u1', 10);
    const [, params] = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(params[1]).toBe(10);
  });
});
