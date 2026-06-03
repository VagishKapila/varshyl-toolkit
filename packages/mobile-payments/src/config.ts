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

/**
 * Same field names as auth-social AuthTheme — pass one object to both
 * AuthThemeProvider and PaymentsThemeProvider (modules cannot import each other).
 */
export interface PaymentsAppTheme {
  primary: string;
  primaryHover: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  error: string;
  success: string;
  radius: string;
  fontHeading?: string;
  fontBody?: string;
}

/** @deprecated Use PaymentsAppTheme via PaymentsThemeProvider; still supported in configureSubscriptions({ theme }). */
export interface SubscriptionTheme {
  paper: string;
  brick: string;
  brass: string;
  ink: string;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_PAYMENTS_APP_THEME: PaymentsAppTheme = {
  primary: '#8B3A2F',
  primaryHover: '#6E2E25',
  surface: '#FAF7F0',
  border: '#B8893E',
  text: '#211D18',
  textMuted: '#8a7f6f',
  error: '#8B3A2F',
  success: '#2D6A4F',
  radius: '8px',
  fontHeading: '"Fraunces", Georgia, serif',
  fontBody: '"Inter", system-ui, sans-serif',
};

export const DEFAULT_PAYMENTS_THEME: SubscriptionTheme = {
  paper: DEFAULT_PAYMENTS_APP_THEME.surface,
  brick: DEFAULT_PAYMENTS_APP_THEME.primary,
  brass: DEFAULT_PAYMENTS_APP_THEME.border,
  ink: DEFAULT_PAYMENTS_APP_THEME.text,
  fontHeading: DEFAULT_PAYMENTS_APP_THEME.fontHeading ?? '"Fraunces", Georgia, serif',
  fontBody: DEFAULT_PAYMENTS_APP_THEME.fontBody ?? '"Inter", system-ui, sans-serif',
};

export const DEFAULT_PRODUCT_CONFIG: ProductPaymentsConfig = {
  productSlug: 'jobsiteintel',
  entitlementId: 'premium',
  monthlyProductId: 'jobsiteintel_premium_monthly',
};
