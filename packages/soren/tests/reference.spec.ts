import { describe, expect, it } from 'vitest';
import { createReferenceAdapter, SorenMemoryStore, type SorenRecord } from '../src/reference';
import type { SorenVerbContext } from '../src/server';

const ctx: SorenVerbContext = { productId: 'soren-demo', now: new Date('2026-06-14T12:00:00') };

function photosToday(n: number): SorenRecord[] {
  const base = new Date('2026-06-14T09:00:00').getTime();
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, type: 'photo', title: `photo ${i}`, createdAt: base + i * 1000 }));
}

describe('reference adapter — find', () => {
  it('filters by the time window', async () => {
    const store = new SorenMemoryStore([
      ...photosToday(2),
      { id: 'old', type: 'photo', title: 'old', createdAt: new Date('2026-06-01T09:00:00').getTime() },
    ]);
    const a = createReferenceAdapter({ store });
    const res = await a.find!({ type: 'photo', when: 'today' }, ctx);
    expect(res.card?.meta?.total).toBe(2);
    expect(res.speech).toMatch(/Found 2 photos from today/);
  });

  it('caps at the default limit and reports "showing N of M"', async () => {
    const store = new SorenMemoryStore(photosToday(25));
    const a = createReferenceAdapter({ store });
    const res = await a.find!({ type: 'photo', when: 'today' }, ctx);
    expect(res.card?.meta?.shown).toBe(20);
    expect(res.card?.meta?.total).toBe(25);
    expect(res.card?.subtitle).toBe('Showing 20 of 25');
  });

  it('returns an info card when nothing matches', async () => {
    const a = createReferenceAdapter({ store: new SorenMemoryStore() });
    const res = await a.find!({ type: 'photo', when: 'today' }, ctx);
    expect(res.card?.kind).toBe('info');
    expect(res.speech).toMatch(/couldn't find/i);
  });
});

describe('reference adapter — delete (always confirmed, re-validated)', () => {
  function noteStore() {
    return new SorenMemoryStore([{ id: 'n1', type: 'note', title: 'note one', createdAt: Date.now() }]);
  }

  it('first call returns a confirm card that invokes delete with confirmed:true', async () => {
    const a = createReferenceAdapter({ store: noteStore() });
    const res = await a.delete!({ id: 'n1' }, ctx);
    expect(res.card?.kind).toBe('confirm');
    const confirm = res.card?.actions?.find((x) => x.id === 'confirm');
    expect(confirm?.effect).toMatchObject({ kind: 'invoke', verb: 'delete', params: { id: 'n1', confirmed: true } });
  });

  it('confirmed delete removes the record', async () => {
    const store = noteStore();
    const a = createReferenceAdapter({ store });
    const res = await a.delete!({ id: 'n1', confirmed: true }, ctx);
    expect(store.get('n1')).toBeUndefined();
    expect(res.speech).toMatch(/deleted/i);
  });

  it('does not delete blind: stale confirmed id is rejected gracefully (D3)', async () => {
    const a = createReferenceAdapter({ store: noteStore() });
    await a.delete!({ id: 'n1', confirmed: true }, ctx);
    const stale = await a.delete!({ id: 'n1', confirmed: true }, ctx);
    expect(stale.card?.kind).toBe('info');
    expect(stale.speech).toMatch(/gone/i);
  });

  it('refuses a confirmed delete with no resolvable target', async () => {
    const a = createReferenceAdapter({ store: noteStore() });
    const res = await a.delete!({ confirmed: true }, ctx);
    expect(res.speech).toMatch(/won't delete blind/i);
  });
});
