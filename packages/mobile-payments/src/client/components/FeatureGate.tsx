import React from 'react';
import type { AccessMode } from '../../types.js';
import { getSubscriptionTheme } from '../configure.js';

interface FeatureGateProps {
  accessMode: AccessMode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Shown when write is blocked (e.g. paywall link). */
  blockedAction?: React.ReactNode;
}

export function FeatureGate({
  accessMode,
  children,
  fallback,
  blockedAction,
}: FeatureGateProps): React.ReactElement {
  const theme = getSubscriptionTheme();

  if (accessMode.canWrite) {
    return <>{children}</>;
  }

  return (
    <div data-testid="feature-gate-blocked">
      {fallback}
      <div
        style={{
          opacity: 0.5,
          pointerEvents: 'none',
          fontFamily: theme.fontBody,
        }}
        aria-disabled
      >
        {children}
      </div>
      {blockedAction ?? (
        <p data-testid="feature-gate-message" style={{ color: theme.brick, marginTop: '8px' }}>
          Subscribe to unlock this action.
        </p>
      )}
    </div>
  );
}
