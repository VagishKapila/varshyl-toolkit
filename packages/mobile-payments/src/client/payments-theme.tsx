'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PaymentsAppTheme } from '../config.js';
import { DEFAULT_PAYMENTS_APP_THEME } from '../config.js';
import { getLegacySubscriptionThemeConfigured } from './configure.js';
import { mergePaymentsTheme, paymentsThemeToCssVars, subscriptionThemeToApp } from './payments-theme-vars.js';

const PaymentsThemeContext = createContext<PaymentsAppTheme | null>(null);

let devWarnedNoProvider = false;

function warnNoThemeProvider(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;
  if (devWarnedNoProvider) return;
  devWarnedNoProvider = true;
  console.warn(
    '[@varshylinc/mobile-payments] Paywall UI is using default theme. For branded paywalls, wrap your app with <PaymentsThemeProvider theme={…}> (use the same theme object as auth-social AuthThemeProvider). See README.md#theming.',
  );
}

export interface PaymentsThemeProviderProps {
  /** AuthTheme-compatible tokens — use the same partial theme as AuthThemeProvider. */
  theme?: Partial<PaymentsAppTheme> | undefined;
  children: ReactNode;
}

/**
 * Mirror of auth-social AuthThemeProvider for billing UI. Products typically pass
 * the same `theme` object to both providers at the app root.
 */
export function PaymentsThemeProvider({
  theme,
  children,
}: PaymentsThemeProviderProps): React.ReactElement {
  const value = useMemo(() => mergePaymentsTheme(theme), [theme]);
  return <PaymentsThemeContext.Provider value={value}>{children}</PaymentsThemeContext.Provider>;
}

export function usePaymentsTheme(): {
  theme: PaymentsAppTheme;
  cssVars: React.CSSProperties;
} {
  const fromProvider = useContext(PaymentsThemeContext);
  const [fromLegacyConfigure, setFromLegacyConfigure] = useState(() =>
    getLegacySubscriptionThemeConfigured(),
  );

  useEffect(() => {
    if (fromProvider != null) return;
    setFromLegacyConfigure(getLegacySubscriptionThemeConfigured());
  }, [fromProvider]);

  const theme = useMemo(() => {
    if (fromProvider) return fromProvider;
    if (fromLegacyConfigure) return subscriptionThemeToApp(fromLegacyConfigure);
    warnNoThemeProvider();
    return DEFAULT_PAYMENTS_APP_THEME;
  }, [fromProvider, fromLegacyConfigure]);

  const cssVars = useMemo(() => paymentsThemeToCssVars(theme), [theme]);

  return { theme, cssVars };
}

