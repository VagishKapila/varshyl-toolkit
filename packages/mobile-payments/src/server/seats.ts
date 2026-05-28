import type { SubscriptionStore } from './store.js';

export async function assignBuyerSeat(
  store: SubscriptionStore,
  orgId: string,
  userId: string,
  assignedBy?: string | null
): Promise<void> {
  await store.assignSeat(orgId, userId, assignedBy ?? userId);
}

export async function userOccupiesSeat(
  store: SubscriptionStore,
  orgId: string,
  userId: string
): Promise<boolean> {
  return store.hasSeat(orgId, userId);
}

export async function countAssignedSeats(
  store: SubscriptionStore,
  orgId: string
): Promise<number> {
  const list = await store.listSeats(orgId);
  return list.length;
}
