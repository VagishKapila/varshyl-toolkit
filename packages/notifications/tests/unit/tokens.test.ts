import { describe, expect, it, vi } from 'vitest';
import { createPgDeviceTokenStore, listEligibleTokens } from '../../src/server/tokens.js';

function mockPool(rows: unknown[] = []) {
  return {
    query: vi.fn().mockResolvedValue({ rows }),
  } as unknown as import('pg').Pool;
}

describe('createPgDeviceTokenStore', () => {
  it('registers a device token via upsert', async () => {
    const pool = mockPool();
    const store = createPgDeviceTokenStore(pool);

    await store.register({
      userId: 'u1',
      orgId: 'o1',
      platform: 'ios',
      token: 'tok-abc',
      announcementsOptIn: true,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO nt_device_tokens'),
      ['u1', 'o1', 'tok-abc', 'ios', true],
    );
  });

  it('listEligible applies announcementsOptIn filter', async () => {
    const pool = mockPool([
      {
        user_id: 'u1',
        org_id: 'o1',
        platform: 'android',
        token: 'tok-1',
        announcements_opt_in: true,
        created_at: new Date('2026-01-01'),
      },
    ]);

    const tokens = await listEligibleTokens(pool, { announcementsOptIn: true });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.token).toBe('tok-1');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('announcements_opt_in = $1'),
      [true],
    );
  });
});
