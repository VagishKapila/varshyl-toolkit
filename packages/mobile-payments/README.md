# @varshylinc/mobile-payments

Seat-aware in-app subscriptions for Varshyl mobile products. Phase 1: Apple IAP + Google Play via RevenueCat.

## Install

```bash
npm install @varshylinc/mobile-payments
```

## Server

```ts
import { Pool } from 'pg';
import {
  createSubscriptionStore,
  runMigrations,
  assertCanWrite,
  createRevenueCatWebhookHandler,
} from '@varshylinc/mobile-payments';

await runMigrations(pool);
const store = createSubscriptionStore(pool, { product: { productSlug: 'myapp', entitlementId: 'premium', monthlyProductId: 'myapp_premium_monthly' } });

// Before any write in your product API:
if (!(await assertCanWrite(store, orgId, userId))) {
  return res.status(403).json({ error: 'Subscription required' });
}

app.post('/webhooks/revenuecat', createRevenueCatWebhookHandler(store, config));
```

## Client

```tsx
import {
  configureSubscriptions,
  PaywallScreen,
  FeatureGate,
  useSubscription,
  createMockSubscriptionService,
} from '@varshylinc/mobile-payments/client';

configureSubscriptions({
  config: { orgId: 'org-123', userId: 'user-456' },
  service: createMockSubscriptionService(), // or RevenueCat via ./client/revenuecat
});

function App() {
  const { accessMode } = useSubscription();
  return (
    <FeatureGate accessMode={accessMode}>
      <CreateButton />
    </FeatureGate>
  );
}
```

See `MODULE.md` for the full contract, seat model, and Phase 2 design notes.
