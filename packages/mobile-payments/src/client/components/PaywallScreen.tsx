import React, { useEffect, useState } from 'react';
import type { Offering } from '../../types.js';
import { getSubscriptionService, getSubscriptionTheme } from '../configure.js';
import { RestoreButton } from './RestoreButton.js';

interface PaywallScreenProps {
  onSubscribed?: () => void;
  onRestore?: () => void;
}

export function PaywallScreen({ onSubscribed, onRestore }: PaywallScreenProps): React.ReactElement {
  const theme = getSubscriptionTheme();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pkg = offerings[0]?.packages[0];

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
      style={{
        background: theme.paper,
        color: theme.ink,
        fontFamily: theme.fontBody,
        padding: '32px',
        maxWidth: '420px',
        margin: '0 auto',
        borderRadius: '12px',
      }}
    >
      <h1
        style={{ fontFamily: theme.fontHeading, color: theme.brick, marginBottom: '8px' }}
        data-testid="paywall-title"
      >
        Subscribe
      </h1>
      {loading && <p data-testid="paywall-loading">Loading plans…</p>}
      {!loading && pkg && (
        <>
          <p data-testid="paywall-price" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {pkg.priceString}/mo
          </p>
          {pkg.trialLabel && (
            <p data-testid="paywall-trial" style={{ color: theme.brass }}>
              {pkg.trialLabel}
            </p>
          )}
        </>
      )}
      {error && <p data-testid="paywall-error" style={{ color: theme.brick }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        <button
          type="button"
          data-testid="paywall-subscribe"
          disabled={busy || !pkg}
          onClick={() => void subscribe()}
          style={{
            background: theme.brick,
            color: theme.paper,
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          Subscribe
        </button>
        <RestoreButton onRestored={onRestore} disabled={busy} />
      </div>
    </div>
  );
}
