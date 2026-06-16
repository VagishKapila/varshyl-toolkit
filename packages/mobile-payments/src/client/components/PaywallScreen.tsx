import React, { useEffect, useLayoutEffect, useState } from 'react';
import type { Offering } from '../../types.js';
import { getSubscriptionService } from '../configure.js';
import { usePaymentsTheme } from '../payments-theme.js';
import { RestoreButton } from './RestoreButton.js';
import { ensurePaywallStyles } from './injectPaywallStyles.js';

export interface PaywallScreenProps {
  platform: 'ios' | 'android';
  price: string;
  period?: string;
  trialDays?: number;
  onSubscribed?: () => void;
  onRestore?: () => void;
  paywallClassName?: string;
  planCardClassName?: string;
  ctaButtonClassName?: string;
  restoreButtonClassName?: string;
  errorClassName?: string;
}

const PaywallDisclosure = ({
  price,
  period,
  trialDays,
  platform,
}: {
  price: string;
  period: string;
  trialDays?: number;
  platform: 'ios' | 'android';
}) => {
  const store = platform === 'ios' ? 'App Store' : 'Google Play';
  return (
    <div className="mp-disclosure" data-testid="paywall-disclosure">
      {trialDays != null && trialDays > 0 && (
        <p>{trialDays}-day free trial, then {price}/{period}.</p>
      )}
      <p>
        Payment will be charged to your {store} account at confirmation of purchase.
        Subscription automatically renews unless auto-renew is turned off at least 24 hours
        before the end of the current period.
      </p>
      <p>Manage or cancel your subscription in your {store} account settings.</p>
    </div>
  );
};

export function PaywallScreen({
  platform,
  price,
  period = 'month',
  trialDays,
  onSubscribed,
  onRestore,
  paywallClassName = '',
  planCardClassName = '',
  ctaButtonClassName = '',
  restoreButtonClassName = '',
  errorClassName = '',
}: PaywallScreenProps): React.ReactElement {
  useLayoutEffect(() => {
    ensurePaywallStyles();
  }, []);

  const { cssVars } = usePaymentsTheme();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pkg = offerings[0]?.packages[0];
  const displayPrice = pkg?.priceString ?? price;

  useEffect(() => {
    getSubscriptionService()
      .getOfferings()
      .then(setOfferings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async () => {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    try {
      await getSubscriptionService().purchase(pkg.identifier);
      onSubscribed?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="paywall-screen"
      className={`mp-paywall ${paywallClassName}`.trim()}
      style={cssVars}
    >
      <h1 className="mp-paywall__title" data-testid="paywall-title">
        Subscribe
      </h1>
      {loading && <p data-testid="paywall-loading">Loading plans…</p>}
      {!loading && pkg && (
        <div className={`mp-paywall__plan-card ${planCardClassName}`.trim()}>
          <p className="mp-paywall__price" data-testid="paywall-price">
            {displayPrice}/{period}
          </p>
          {pkg.trialLabel && (
            <p className="mp-paywall__trial" data-testid="paywall-trial">
              {pkg.trialLabel}
            </p>
          )}
        </div>
      )}
      {error && (
        <p
          className={`mp-paywall__error ${errorClassName}`.trim()}
          data-testid="paywall-error"
        >
          {error}
        </p>
      )}
      <div className="mp-paywall__actions">
        <button
          type="button"
          data-testid="paywall-subscribe"
          disabled={busy || !pkg}
          onClick={() => void subscribe()}
          className={`mp-paywall__cta ${ctaButtonClassName}`.trim()}
        >
          Subscribe
        </button>
        <RestoreButton
          onRestored={onRestore}
          disabled={busy}
          restoreButtonClassName={restoreButtonClassName}
        />
      </div>
      <PaywallDisclosure
        price={displayPrice}
        period={period}
        trialDays={trialDays}
        platform={platform}
      />
    </div>
  );
}
