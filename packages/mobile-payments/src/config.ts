import type { NormalizedEvent } from './types.js';

export interface SeatPricingTier {
  minSeats: number;
  pricePerSeat: number;
}

/** Phase 2 placeholder — unused in Phase 1. */
export interface ProductPaymentsConfig {
  productSlug: string;
  entitlementId: string;
  monthlyProductId: string;
  /** Phase 2: Stripe web seat volume tiers (exact numbers TBD). */
  seatPricing?: SeatPricingTier[];
}

export interface PaymentsConfig {
  product: ProductPaymentsConfig;
  revenueCatWebhookSecret?: string;
  /** SuperLogin / cross-product aggregation hook (no-op default). */
  onSubscriptionEvent?: (event: NormalizedEvent) => void;
}

export interface ClientPaymentsConfig {
  orgId: string;
  userId: string;
  apiBaseUrl?: string;
  revenueCatApiKey?: string;
}

export interface SubscriptionTheme {
  paper: string;
  brick: string;
  brass: string;
  ink: string;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_PAYMENTS_THEME: SubscriptionTheme = {
  paper: '#FAF7F0',
  brick: '#8B3A2F',
  brass: '#B8893E',
  ink: '#211D18',
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
};

export const DEFAULT_PRODUCT_CONFIG: ProductPaymentsConfig = {
  productSlug: 'jobsiteintel',
  entitlementId: 'premium',
  monthlyProductId: 'jobsiteintel_premium_monthly',
};
