import { describe, expect, it } from 'vitest';
import { DEFAULT_FIND_LIMIT, paginate, showingSubtitle } from '../src';

describe('pagination', () => {
  it('defaults to DEFAULT_FIND_LIMIT', () => {
    const r = paginate(Array.from({ length: 50 }, (_, i) => i));
    expect(r.shown).toBe(DEFAULT_FIND_LIMIT);
    expect(r.total).toBe(50);
    expect(r.truncated).toBe(true);
  });

  it('does not truncate small sets', () => {
    const r = paginate([1, 2, 3]);
    expect(r.truncated).toBe(false);
    expect(showingSubtitle(r.shown, r.total)).toBeUndefined();
  });

  it('produces a "Showing N of M" subtitle when truncated', () => {
    expect(showingSubtitle(20, 137)).toBe('Showing 20 of 137');
  });

  it('clamps invalid limits back to the default', () => {
    const r = paginate([1, 2, 3, 4, 5], -3);
    expect(r.shown).toBe(5);
  });
});
