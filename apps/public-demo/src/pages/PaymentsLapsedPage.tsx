import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PaywallScreen,
  FeatureGate,
  ReadOnlyBanner,
  useSubscription,
} from '@varshylinc/mobile-payments/client';
import { DemoShell } from '../components/DemoShell.js';
import { paymentsMock } from '../setupPackages.js';

export function PaymentsLapsedPage(): React.ReactElement {
  const { accessMode, status, loading, refresh } = useSubscription();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded) {
      paymentsMock.forceLapsed();
      void refresh();
      setSeeded(true);
    }
  }, [seeded, refresh]);

  if (loading || !seeded) {
    return <DemoShell title="mobile-payments — Read-only lapse">Loading…</DemoShell>;
  }

  return (
    <DemoShell title="mobile-payments — Read-only after lapse">
      <p className="text-sm mb-4" style={{ color: '#B8893E' }}>
        Subscription lapsed — users keep read access but lose write permission (enforced in UI and on server in real apps).
      </p>
      <p data-testid="payments-status" className="sr-only">
        {status}
      </p>
      <ReadOnlyBanner />
      <PaywallScreen
        platform="ios"
        price="$35.00"
        period="month"
        trialDays={90}
        onSubscribed={() => void refresh()}
        onRestore={() => void refresh()}
      />
      <section className="mt-6 rounded border p-4" style={{ borderColor: '#E8DFD0' }}>
        <h2 className="text-sm font-semibold mb-2">Existing data (read allowed)</h2>
        <p data-testid="payments-read-data" className="text-sm">
          Existing log entry #42 — still visible in read-only mode.
        </p>
        <div className="mt-3">
          <FeatureGate accessMode={accessMode}>
            <button type="button" data-testid="payments-create-log" className="text-sm underline">
              Create log (blocked)
            </button>
          </FeatureGate>
        </div>
      </section>
      <p className="mt-4 text-sm text-center">
        <Link to="/payments/paywall" style={{ color: '#8B3A2F' }}>
          ← Paywall (fresh subscribe)
        </Link>
      </p>
    </DemoShell>
  );
}
