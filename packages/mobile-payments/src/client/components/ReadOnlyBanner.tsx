import React from 'react';
import { getSubscriptionTheme } from '../configure.js';

export function ReadOnlyBanner(): React.ReactElement {
  const theme = getSubscriptionTheme();
  return (
    <div
      data-testid="read-only-banner"
      style={{
        background: theme.brass,
        color: theme.paper,
        padding: '12px 16px',
        borderRadius: '8px',
        fontFamily: theme.fontBody,
        marginBottom: '16px',
      }}
    >
      Your subscription has lapsed. You can view existing data but cannot create or edit.
    </div>
  );
}
