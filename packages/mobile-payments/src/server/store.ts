import type {
  AppendEventInput,
  SeatAssignment,
  SubscriptionRecord,
  UpsertSubscriptionInput,
} from '../types.js';

export interface SubscriptionStore {
  getSubscription(orgId: string): Promise<SubscriptionRecord | null>;
  upsertSubscription(input: UpsertSubscriptionInput): Promise<SubscriptionRecord>;
  appendEvent(input: AppendEventInput): Promise<void>;
  assignSeat(orgId: string, userId: string, assignedBy?: string | null): Promise<void>;
  removeSeat(orgId: string, userId: string): Promise<void>;
  hasSeat(orgId: string, userId: string): Promise<boolean>;
  listSeats(orgId: string): Promise<SeatAssignment[]>;
}
