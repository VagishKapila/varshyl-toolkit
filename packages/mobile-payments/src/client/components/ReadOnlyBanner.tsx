import React from 'react';
import { usePaymentsTheme } from '../payments-theme.js';
import './PaywallStyles.css';

export interface ReadOnlyBannerProps {
  bannerClassName?: string;
}

export function ReadOnlyBanner({ bannerClassName = '' }: ReadOnlyBannerProps): React.ReactElement {
  const { cssVars } = usePaymentsTheme();

  return (
    <div
      data-testid="read-only-banner"
      className={`mp-read-only-banner ${bannerClassName}`.trim()}
      style={cssVars}
    >
      Your subscription has lapsed. You can view existing data but cannot create or edit.
    </div>
  );
}
