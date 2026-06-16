import React, { useCallback, useState } from 'react';
import {
  PaywallScreen,
  FeatureGate,
  ReadOnlyBanner,
  configureSubscriptions,
  createMockSubscriptionService,
  useSubscription,
} from '@varshylinc/mobile-payments/client';

const DEMO_ORG_ID = 'demo-org-1';
const DEMO_BUYER_ID = 'user-1';

const mockService = createMockSubscriptionService({
  orgId: DEMO_ORG_ID,
  userId: DEMO_BUYER_ID,
  syncBaseUrl: '/api/payments',
});

configureSubscriptions({
  service: mockService,
  config: {
    orgId: DEMO_ORG_ID,
    userId: DEMO_BUYER_ID,
    apiBaseUrl: '/api/payments',
  },
});

export function PaymentsDemoPage(): React.ReactElement {
  const { accessMode, status, loading, refresh } = useSubscription();
  const [readData] = useState('Existing log entry #42 — visible in read-only mode');
  const [created, setCreated] = useState<string[]>([]);

  const createLog = useCallback(() => {
    setCreated((prev) => [...prev, `New log ${Date.now()}`]);
  }, []);

  const forceLapse = async () => {
    mockService.forceLapsed();
    await fetch('/api/payments/mock/force-lapse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: DEMO_ORG_ID }),
    });
    await refresh();
  };

  if (loading) {
    return <div data-testid="payments-loading">Loading subscription…</div>;
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }} data-testid="payments-demo">
      <h1>Mobile Payments Demo</h1>
      <p data-testid="payments-status">Status: {status}</p>

      {status === 'lapsed' && <ReadOnlyBanner />}

      {(status === 'none' || status === 'lapsed') && (
        <PaywallScreen
          platform="ios"
          price="$35.00"
          period="month"
          trialDays={90}
          onSubscribed={() => {
            void refresh();
          }}
          onRestore={() => {
            void refresh();
          }}
        />
      )}

      <section style={{ marginTop: '24px' }} data-testid="payments-read-section">
        <h2>Read (always allowed)</h2>
        <p data-testid="payments-read-data">{readData}</p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2>Write (gated)</h2>
        <FeatureGate accessMode={accessMode}>
          <button
            type="button"
            data-testid="payments-create-log"
            onClick={createLog}
            disabled={!accessMode.canWrite}
          >
            Create log
          </button>
        </FeatureGate>
        <ul data-testid="payments-created-list">
          {created.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <button type="button" data-testid="payments-force-lapse" onClick={() => void forceLapse()}>
        Force lapse (test)
      </button>
    </div>
  );
}
