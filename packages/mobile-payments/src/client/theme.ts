import type { SubscriptionTheme } from '../config.js';
import { configureSubscriptions, getSubscriptionTheme } from './configure.js';

/** @deprecated Prefer PaymentsThemeProvider or configureSubscriptions({ theme }). */
export function setSubscriptionTheme(next: Partial<SubscriptionTheme>): void {
  configureSubscriptions({
    config: { orgId: '', userId: '' },
    theme: next,
  });
}

/** @deprecated Use usePaymentsTheme() in React components. */
export function getTheme(): SubscriptionTheme {
  return getSubscriptionTheme();
}

export { DEFAULT_PAYMENTS_THEME } from '../config.js';
