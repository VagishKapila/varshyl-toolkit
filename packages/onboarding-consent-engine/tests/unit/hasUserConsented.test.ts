import { describe, it, expect, vi } from 'vitest';
import { hasUserConsented } from '../../src/server/lib/hasUserConsented.js';
import type { Pool } from 'pg';

function makePool(rows: object[]): Pool {
  return { query: vi.fn().mockResolvedValue({ rows }) } as unknown as Pool;
}

describe('hasUserConsented', () => {
  it('returns true when latest record is granted=true', async () => {
    const pool = makePool([{ granted: true }]);
    expect(await hasUserConsented(pool, 'u1', 'terms_of_service')).toBe(true);
  });

  it('returns false when latest record is granted=false', async () => {
    const pool = makePool([{ granted: false }]);
    expect(await hasUserConsented(pool, 'u1', 'terms_of_service')).toBe(false);
  });

  it('returns false when no record exists', async () => {
    const pool = makePool([]);
    expect(await hasUserConsented(pool, 'u1', 'terms_of_service')).toBe(false);
  });
});
