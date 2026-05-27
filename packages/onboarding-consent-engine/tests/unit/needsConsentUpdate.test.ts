import { describe, it, expect, vi } from 'vitest';
import { needsConsentUpdate } from '../../src/server/lib/needsConsentUpdate.js';
import type { Pool } from 'pg';

function makePool(rows: object[]): Pool {
  return { query: vi.fn().mockResolvedValue({ rows }) } as unknown as Pool;
}

describe('needsConsentUpdate', () => {
  it('returns definitions that still need consent', async () => {
    const missing = [
      { id: 1, key: 'terms_of_service', version: 2, required: true, display_text: 'ToS' },
    ];
    const pool = makePool(missing);
    const result = await needsConsentUpdate(pool, 'u1');
    expect(result).toEqual(missing);
  });

  it('returns empty array when user has all current consents', async () => {
    const pool = makePool([]);
    const result = await needsConsentUpdate(pool, 'u1');
    expect(result).toHaveLength(0);
  });
});
