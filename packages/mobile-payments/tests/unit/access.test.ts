import { describe, it, expect } from 'vitest';
import { createMockSubscriptionStore } from '../../src/server/mock-store.js';
import { assertCanWrite, getAccessModeForUser } from '../../src/server/access.js';
import { assignBuyerSeat } from '../../src/server/seats.js';

describe('assertCanWrite', () => {
  it('allows write for seated user on trial', async () => {
    const store = createMockSubscriptionStore();
    await store.upsertSubscription({
      orgId: 'org-1',
      productSlug: 'test',
      status: 'trial',
      seats: 1,
    });
    await assignBuyerSeat(store, 'org-1', 'user-1');
    expect(await assertCanWrite(store, 'org-1', 'user-1')).toBe(true);
    expect(await assertCanWrite(store, 'org-1', 'user-2')).toBe(false);
  });

  it('blocks write when lapsed', async () => {
    const store = createMockSubscriptionStore();
    await store.upsertSubscription({
      orgId: 'org-1',
      productSlug: 'test',
      status: 'lapsed',
      seats: 1,
    });
    await assignBuyerSeat(store, 'org-1', 'user-1');
    expect(await assertCanWrite(store, 'org-1', 'user-1')).toBe(false);
  });

  it('always allows read via access mode', async () => {
    const store = createMockSubscriptionStore();
    await store.upsertSubscription({
      orgId: 'org-1',
      productSlug: 'test',
      status: 'lapsed',
      seats: 1,
    });
    await assignBuyerSeat(store, 'org-1', 'user-1');
    const mode = await getAccessModeForUser(store, 'org-1', 'user-1');
    expect(mode.canRead).toBe(true);
    expect(mode.canWrite).toBe(false);
  });
});
