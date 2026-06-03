import type { ClientPaymentsConfig, ProductPaymentsConfig } from '../config.js';
import {
  DEFAULT_PAYMENTS_THEME,
  DEFAULT_PRODUCT_CONFIG,
  type SubscriptionTheme,
} from '../config.js';
import { createMockSubscriptionService } from './service/mock-service.js';
import type { SubscriptionService } from './service/subscription-service.js';

let service: SubscriptionService = createMockSubscriptionService();
let theme: SubscriptionTheme = DEFAULT_PAYMENTS_THEME;
let legacyThemeCustomized = false;
let clientConfig: ClientPaymentsConfig = { orgId: '', userId: '' };
let productConfig: ProductPaymentsConfig = DEFAULT_PRODUCT_CONFIG;

export function configureSubscriptions(input: {
  service?: SubscriptionService;
  theme?: Partial<SubscriptionTheme>;
  config: ClientPaymentsConfig & { product?: ProductPaymentsConfig };
}): void {
  clientConfig = input.config;
  productConfig = input.config.product ?? DEFAULT_PRODUCT_CONFIG;
  if (input.service) service = input.service;
  if (input.theme) {
    theme = { ...DEFAULT_PAYMENTS_THEME, ...input.theme };
    legacyThemeCustomized = true;
  }
}

/** Used by usePaymentsTheme when PaymentsThemeProvider is absent. */
export function getLegacySubscriptionThemeConfigured(): SubscriptionTheme | null {
  return legacyThemeCustomized ? theme : null;
}

export function getSubscriptionService(): SubscriptionService {
  return service;
}

export function getSubscriptionTheme(): SubscriptionTheme {
  return theme;
}

export function getClientConfig(): ClientPaymentsConfig {
  return clientConfig;
}

export function getProductConfig(): ProductPaymentsConfig {
  return productConfig;
}
