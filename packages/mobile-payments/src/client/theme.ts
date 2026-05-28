import type { SubscriptionTheme } from '../config.js';
import { DEFAULT_PAYMENTS_THEME } from '../config.js';

let theme: SubscriptionTheme = DEFAULT_PAYMENTS_THEME;

export function setSubscriptionTheme(next: Partial<SubscriptionTheme>): void {
  theme = { ...theme, ...next };
}

export function getTheme(): SubscriptionTheme {
  return theme;
}

export { DEFAULT_PAYMENTS_THEME };
