import { describe, it, expect, vi } from 'vitest';
import { recordConsent } from '../../src/server/lib/recordConsent.js';
import type { Pool } from 'pg';

function makePool(rows: object[]): Pool {
  return { query: vi.fn().mockResolvedValue({ rows }) } as unknown as Pool;
}

describe('recordConsent', () => {
  it('inserts a consent record and returns it', async () => {
    const expected = {
      id: 1,
      user_id: '42',
      definition_id: 3,
      version: 1,
      granted: true,
      ip_address: '127.0.0.1',
      user_agent: 'vitest',
      consented_at: new Date(),
    };
    const pool = makePool([expected]);
    const result = await recordConsent(pool, {
      userId: '42',
      definitionId: 3,
      version: 1,
      granted: true,
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    expect(result).toEqual(expected);
    expect(pool.query).toHaveBeenCalledOnce();
  });

  it('passes null for missing ipAddress and userAgent', async () => {
    const pool = makePool([{ id: 1 }]);
    await recordConsent(pool, { userId: 'u1', definitionId: 1, version: 1, granted: false });
    const [, params] = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(params[4]).toBeNull();
    expect(params[5]).toBeNull();
  });
});
