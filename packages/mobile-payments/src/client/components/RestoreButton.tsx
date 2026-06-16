import React, { useLayoutEffect } from 'react';
import { getSubscriptionService } from '../configure.js';
import { usePaymentsTheme } from '../payments-theme.js';
import { ensurePaywallStyles } from './injectPaywallStyles.js';

export interface RestoreButtonProps {
  onRestored?: () => void;
  disabled?: boolean;
  restoreButtonClassName?: string;
}

export function RestoreButton({
  onRestored,
  disabled,
  restoreButtonClassName = '',
}: RestoreButtonProps): React.ReactElement {
  useLayoutEffect(() => {
    ensurePaywallStyles();
  }, []);

  const { cssVars } = usePaymentsTheme();

  const restore = async () => {
    await getSubscriptionService().restore();
    onRestored?.();
  };

  return (
    <button
      type="button"
      data-testid="paywall-restore"
      disabled={disabled}
      onClick={() => void restore()}
      className={`mp-restore-button ${restoreButtonClassName}`.trim()}
      style={cssVars}
    >
      Restore Purchases
    </button>
  );
}
