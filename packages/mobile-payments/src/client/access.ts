import type { AccessMode, SubscriptionStatus } from '../types.js';

const WRITE_STATUSES: SubscriptionStatus[] = ['trial', 'active'];

export function resolveClientAccessMode(
  status: SubscriptionStatus,
  hasSeat: boolean
): AccessMode {
  return {
    canRead: true,
    canWrite: WRITE_STATUSES.includes(status) && hasSeat,
  };
}
