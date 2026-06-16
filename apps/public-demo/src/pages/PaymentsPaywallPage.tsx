import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PaywallScreen, FeatureGate, useSubscription } from '@varshylinc/mobile-payments/client';
import { DemoShell } from '../components/DemoShell.js';

export function PaymentsPaywallPage(): React.ReactElement {
  const { accessMode, status, loading, refresh } = useSubscription();
  const [created, setCreated] = useState<string[]>([]);
  const createLog = useCallback(() => {
    setCreated((prev) => [...prev, `New log ${Date.now()}`]);
  }, []);

  if (loading) return <DemoShell title="mobile-payments — Paywall">Loading…</DemoShell>;

  return (
    <DemoShell title="mobile-payments — Subscription paywall">
      <p className="text-sm mb-4" style={{ color: '#B8893E' }}>
        Status: <strong data-testid="payments-status">{status}</strong> — mock RevenueCat, no backend.
      </p>
      {(status === 'none' || status === 'lapsed') && (
        <PaywallScreen
          platform="ios"
          price="$35.00"
          period="month"
          trialDays={90}
          onSubscribed={() => void refresh()}
          onRestore={() => void refresh()}
        />
      )}
      {status !== 'none' && status !== 'lapsed' && (
        <p className="text-sm mb-4 rounded border p-3" style={{ borderColor: '#E8DFD0' }}>
          Subscribed (mock).{' '}
          <button type="button" className="underline" onClick={() => void refresh()}>
            Refresh
          </button>
        </p>
      )}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: '"Fraunces", serif', color: '#8B3A2F' }}>
          Write gate preview
        </h2>
        <FeatureGate accessMode={accessMode}>
          <button
            type="button"
            data-testid="payments-create-log"
            onClick={createLog}
            className="rounded px-3 py-2 text-sm text-white"
            style={{ backgroundColor: '#8B3A2F' }}
          >
            Create log (requires subscription)
          </button>
        </FeatureGate>
        <ul className="mt-2 text-sm">{created.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <p className="mt-4 text-sm text-center">
        <Link to="/payments/lapsed" style={{ color: '#8B3A2F' }}>
          See read-only lapse state →
        </Link>
      </p>
    </DemoShell>
  );
}
