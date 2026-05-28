import type {
  AppendEventInput,
  SeatAssignment,
  SubscriptionRecord,
  UpsertSubscriptionInput,
} from '../types.js';
import type { SubscriptionStore } from './store.js';

export function createMockSubscriptionStore(): SubscriptionStore {
  const subs = new Map<string, SubscriptionRecord>();
  const seats = new Map<string, Set<string>>();
  const events: AppendEventInput[] = [];

  const seatKey = (orgId: string, userId: string) => `${orgId}:${userId}`;

  return {
    async getSubscription(orgId) {
      return subs.get(orgId) ?? null;
    },

    async upsertSubscription(input: UpsertSubscriptionInput) {
      const existing = subs.get(input.orgId);
      const record: SubscriptionRecord = {
        orgId: input.orgId,
        productSlug: input.productSlug,
        status: input.status,
        seats: input.seats ?? existing?.seats ?? 1,
        store: input.store ?? existing?.store ?? null,
        currentPeriodEnd: input.currentPeriodEnd ?? existing?.currentPeriodEnd ?? null,
        trialEndsAt: input.trialEndsAt ?? existing?.trialEndsAt ?? null,
        rcAppUserId: input.rcAppUserId ?? existing?.rcAppUserId ?? input.orgId,
      };
      subs.set(input.orgId, record);
      return record;
    },

    async appendEvent(input) {
      events.push(input);
    },

    async assignSeat(orgId, userId, _assignedBy) {
      if (!seats.has(orgId)) seats.set(orgId, new Set());
      seats.get(orgId)!.add(userId);
      void seatKey(orgId, userId);
    },

    async removeSeat(orgId, userId) {
      seats.get(orgId)?.delete(userId);
    },

    async hasSeat(orgId, userId) {
      return seats.get(orgId)?.has(userId) ?? false;
    },

    async listSeats(orgId) {
      const set = seats.get(orgId);
      if (!set) return [];
      return [...set].map((userId): SeatAssignment => ({
        orgId,
        userId,
        assignedAt: new Date().toISOString(),
        assignedBy: null,
      }));
    },
  };
}

export function createMockSubscriptionStoreWithCapture(): {
  store: SubscriptionStore;
  getEvents: () => AppendEventInput[];
} {
  const captured: AppendEventInput[] = [];
  const inner = createMockSubscriptionStore();
  return {
    store: {
      ...inner,
      async appendEvent(input) {
        captured.push(input);
        return inner.appendEvent(input);
      },
    },
    getEvents: () => [...captured],
  };
}
