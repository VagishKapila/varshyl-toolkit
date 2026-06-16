export type SubscriptionStatus = 'trial' | 'active' | 'lapsed' | 'none';

export type SubscriptionStoreType = 'apple' | 'google' | 'stripe';

export interface AccessMode {
  canRead: boolean;
  canWrite: boolean;
}

export interface SubscriptionRecord {
  orgId: string;
  productSlug: string;
  status: SubscriptionStatus;
  seats: number;
  store: SubscriptionStoreType | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  rcAppUserId: string | null;
}

export interface SubscriptionState {
  orgId: string;
  status: SubscriptionStatus;
  seats: number;
  isActive: boolean;
  isInTrial: boolean;
  expiresAt: string | null;
  accessMode: AccessMode;
}

export interface SeatAssignment {
  orgId: string;
  userId: string;
  assignedAt: string;
  assignedBy: string | null;
}

export interface NormalizedEvent {
  product_slug: string;
  amount: number | null;
  status: string;
  timestamp: string;
}

export interface OfferingPackage {
  identifier: string;
  priceString: string;
  trialLabel: string | null;
}

export interface Offering {
  identifier: string;
  packages: OfferingPackage[];
}

/** Apple 3.1.1 / Google Play Billing disclosure inputs for PaywallScreen. */
export interface PaywallConfig {
  platform: 'ios' | 'android';
  price: string;
  period?: string;
  trialDays?: number;
}

export interface UpsertSubscriptionInput {
  orgId: string;
  productSlug: string;
  status: SubscriptionStatus;
  seats?: number;
  store?: SubscriptionStoreType | null;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  rcAppUserId?: string | null;
}

export interface AppendEventInput {
  orgId: string;
  productSlug: string;
  eventType: string;
  status: SubscriptionStatus;
  amount?: number | null;
  currency?: string | null;
  occurredAt?: string;
  raw?: Record<string, unknown> | null;
}

export interface SubscriptionActionResult {
  ok: boolean;
  error?: string;
  state?: SubscriptionState;
}
