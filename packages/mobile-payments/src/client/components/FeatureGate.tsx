import React, { useLayoutEffect } from 'react';
import type { AccessMode } from '../../types.js';
import { usePaymentsTheme } from '../payments-theme.js';
import { ensurePaywallStyles } from './injectPaywallStyles.js';

export interface FeatureGateProps {
  accessMode: AccessMode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Shown when write is blocked (e.g. paywall link). */
  blockedAction?: React.ReactNode;
  gateClassName?: string;
  blockedMessageClassName?: string;
}

export function FeatureGate({
  accessMode,
  children,
  fallback,
  blockedAction,
  gateClassName = '',
  blockedMessageClassName = '',
}: FeatureGateProps): React.ReactElement {
  useLayoutEffect(() => {
    ensurePaywallStyles();
  }, []);

  const { cssVars } = usePaymentsTheme();

  if (accessMode.canWrite) {
    return <>{children}</>;
  }

  return (
    <div data-testid="feature-gate-blocked" className={gateClassName.trim() || undefined} style={cssVars}>
      {fallback}
      <div className="mp-feature-gate__blocked" aria-disabled>
        {children}
      </div>
      {blockedAction ?? (
        <p
          className={`mp-feature-gate__message ${blockedMessageClassName}`.trim()}
          data-testid="feature-gate-message"
        >
          Subscribe to unlock this action.
        </p>
      )}
    </div>
  );
}
