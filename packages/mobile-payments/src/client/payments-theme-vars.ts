import type { CSSProperties } from 'react';
import type { PaymentsAppTheme, SubscriptionTheme } from '../config.js';
import { DEFAULT_PAYMENTS_APP_THEME } from '../config.js';

export function mergePaymentsTheme(partial?: Partial<PaymentsAppTheme>): PaymentsAppTheme {
  return { ...DEFAULT_PAYMENTS_APP_THEME, ...partial };
}

/** Maps legacy configureSubscriptions theme keys to PaymentsAppTheme. */
export function subscriptionThemeToApp(theme: SubscriptionTheme): PaymentsAppTheme {
  return mergePaymentsTheme({
    surface: theme.paper,
    primary: theme.brick,
    primaryHover: theme.brick,
    border: theme.brass,
    text: theme.ink,
    textMuted: theme.brass,
    error: theme.brick,
    success: DEFAULT_PAYMENTS_APP_THEME.success,
    radius: DEFAULT_PAYMENTS_APP_THEME.radius,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
  });
}

export function paymentsThemeToCssVars(theme: PaymentsAppTheme): CSSProperties {
  return {
    ['--mp-primary' as string]: theme.primary,
    ['--mp-primary-hover' as string]: theme.primaryHover,
    ['--mp-surface' as string]: theme.surface,
    ['--mp-border' as string]: theme.border,
    ['--mp-ink' as string]: theme.text,
    ['--mp-muted' as string]: theme.textMuted,
    ['--mp-danger' as string]: theme.error,
    ['--mp-success' as string]: theme.success,
    ['--mp-radius' as string]: theme.radius,
    ['--mp-button-radius' as string]: theme.radius,
    ['--mp-font-heading' as string]: theme.fontHeading ?? DEFAULT_PAYMENTS_APP_THEME.fontHeading,
    ['--mp-font-body' as string]: theme.fontBody ?? DEFAULT_PAYMENTS_APP_THEME.fontBody,
  };
}
