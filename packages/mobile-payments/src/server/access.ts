import type { AccessMode, SubscriptionStatus } from '../types.js';
import type { SubscriptionStore } from './store.js';

const WRITE_STATUSES: SubscriptionStatus[] = ['trial', 'active'];

export function resolveAccessMode(
  status: SubscriptionStatus,
  hasSeat: boolean
): AccessMode {
  const canRead = true;
  const canWrite = WRITE_STATUSES.includes(status) && hasSeat;
  return { canRead, canWrite };
}

export async function assertCanWrite(
  store: SubscriptionStore,
  orgId: string,
  userId: string
): Promise<boolean> {
  const sub = await store.getSubscription(orgId);
  if (!sub) return false;
  if (!WRITE_STATUSES.includes(sub.status)) return false;
  return store.hasSeat(orgId, userId);
}

export async function getAccessModeForUser(
  store: SubscriptionStore,
  orgId: string,
  userId: string
): Promise<AccessMode> {
  const sub = await store.getSubscription(orgId);
  if (!sub) {
    return { canRead: true, canWrite: false };
  }
  const hasSeat = await store.hasSeat(orgId, userId);
  return resolveAccessMode(sub.status, hasSeat);
}
