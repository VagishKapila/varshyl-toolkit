import React from 'react';
import { getSubscriptionTheme } from '../configure.js';
import { getSubscriptionService } from '../configure.js';

interface RestoreButtonProps {
  onRestored?: () => void;
  disabled?: boolean;
}

export function RestoreButton({ onRestored, disabled }: RestoreButtonProps): React.ReactElement {
  const theme = getSubscriptionTheme();

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
      style={{
        background: 'transparent',
        color: theme.ink,
        border: `1px solid ${theme.brass}`,
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      Restore Purchases
    </button>
  );
}
