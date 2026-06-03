# @varshylinc/mobile-payments

> Seat-aware in-app subscriptions for Capacitor apps via RevenueCat: Apple IAP + Google Play Billing, free trials, paywall UI, and read-only enforcement on lapse.

![npm](https://img.shields.io/npm/v/@varshylinc/mobile-payments)
![license](https://img.shields.io/npm/l/@varshylinc/mobile-payments)

Part of the **Varshyl Toolkit** — a set of independent, composable packages for building Capacitor + web SaaS apps.

## Screenshots

In-app paywall with pricing, free trial, subscribe, and restore — ready for RevenueCat on iOS and Android.

![Subscription paywall showing monthly price, 90-day free trial, and Subscribe / Restore buttons](https://varshyl-toolkit-demo.netlify.app/screenshots/paywall.png)

## What it does

Manages org-keyed subscription state for Capacitor mobile apps. Syncs purchase events from RevenueCat webhooks, tracks seat assignments, and exposes server-side write guards plus client paywall/gate components. When a subscription lapses, users retain read access but lose write permission — enforced on the server, not just in the UI.

## Install

```bash
npm install @varshylinc/mobile-payments
```

Peer dependencies: `pg` (server), `react` (client).

For real StoreKit / Play Billing on device, also install `@revenuecat/purchases-capacitor` and use `@varshylinc/mobile-payments/client/revenuecat`. CI and local dev can use `createMockSubscriptionService()` — no RevenueCat SDK required.

## Quick start

**Server** — migrate, create store, enforce writes, mount webhook:

```ts
import { Pool } from 'pg';
import express from 'express';
import {
  createSubscriptionStore,
  runMigrations,
  assertCanWrite,
  createRevenueCatWebhookHandler,
} from '@varshylinc/mobile-payments';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await runMigrations(pool);

const store = createSubscriptionStore(pool, {
  product: {
    productSlug: 'myapp',
    entitlementId: 'premium',
    monthlyProductId: 'myapp_premium_monthly',
  },
  revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET,
});

app.post('/api/payments/webhooks/revenuecat', createRevenueCatWebhookHandler(store, config));

app.post('/api/items', async (req, res) => {
  if (!(await assertCanWrite(store, orgId, userId))) {
    return res.status(403).json({ error: 'Subscription required' });
  }
  // … create item
});
```

**Client** — configure with mock or RevenueCat service:

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
  service: createMockSubscriptionService(),
  theme: { accent: '#059669' },
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

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/mobile-payments` | `createSubscriptionStore`, `runMigrations`, `assertCanWrite`, `getAccessModeForUser`, `createRevenueCatWebhookHandler`, `createMockSubscriptionStore`, `assignBuyerSeat`, types |
| `@varshylinc/mobile-payments/client` | `configureSubscriptions`, `PaymentsThemeProvider`, `usePaymentsTheme`, `useSubscription`, `PaywallScreen`, `FeatureGate`, `ReadOnlyBanner`, `RestoreButton`, `subscriptionActions`, `createMockSubscriptionService`, … |
| `@varshylinc/mobile-payments/client/revenuecat` | `createRevenueCatSubscriptionService` — requires optional peer `@revenuecat/purchases-capacitor` |

## Database

Bring your own Postgres. Call `runMigrations(pool)` on boot. Tables use the `mp_` prefix (`mp_subscriptions`, `mp_subscription_events`, `mp_seat_assignments`).

## Theming

Paywall UI reads **AuthTheme-compatible** tokens via `PaymentsThemeProvider` (conceptual parity with `@varshylinc/auth-social` — toolkit modules cannot import each other, so use the **same** `theme` object on both providers).

### Recommended: dual provider at app root

```tsx
import { AuthThemeProvider } from '@varshylinc/auth-social/client';
import {
  PaymentsThemeProvider,
  PaywallScreen,
  configureSubscriptions,
} from '@varshylinc/mobile-payments/client';

const theme = {
  primary: '#3A6B5F',
  primaryHover: '#2D544A',
  surface: '#FAF7F0',
  border: '#e8e0d0',
  text: '#211D18',
  textMuted: '#8a7f6f',
  error: '#8B3A2F',
  success: '#2D6A4F',
  radius: '12px',
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthThemeProvider theme={theme}>
      <PaymentsThemeProvider theme={theme}>{children}</PaymentsThemeProvider>
    </AuthThemeProvider>
  );
}
```

Without any provider, components still render using `DEFAULT_PAYMENTS_APP_THEME` (matches pre-0.3.0 JobSite defaults). Dev mode logs a one-time `console.warn` pointing here.

### Legacy: `configureSubscriptions({ theme })`

Still supported — maps `paper` / `brick` / `brass` / `ink` to the new token model:

```ts
configureSubscriptions({
  config: { orgId, userId },
  theme: { paper: '#FAF7F0', brick: '#8B3A2F', brass: '#B8893E', ink: '#211D18' },
});
```

### `*ClassName` overrides

| Component | Props |
|-----------|--------|
| `PaywallScreen` | `paywallClassName`, `planCardClassName`, `ctaButtonClassName`, `restoreButtonClassName`, `errorClassName` |
| `RestoreButton` | `restoreButtonClassName` |
| `ReadOnlyBanner` | `bannerClassName` |
| `FeatureGate` | `gateClassName`, `blockedMessageClassName` |

### CSS variables (no provider)

Set on a parent of paywall UI:

| Variable | Role |
|----------|------|
| `--mp-primary` | CTA, titles |
| `--mp-primary-hover` | CTA hover |
| `--mp-surface` | Card background |
| `--mp-ink` | Body text |
| `--mp-muted` | Secondary text, banner |
| `--mp-danger` | Errors, blocked messages |
| `--mp-success` | Success states (reserved) |
| `--mp-border` | Outlines |
| `--mp-radius` / `--mp-button-radius` | Corners |
| `--mp-font-heading` / `--mp-font-body` | Typography |

Optional: `@import '@varshylinc/mobile-payments/dist/client/components/PaywallStyles.css'` in your bundler.

## See also

- [@varshylinc/team-management](../team-management) — seat assignment for multi-user orgs (Phase 2)
- [@varshylinc/auth-social](../auth-social) — user identity for seat mapping
- [@varshylinc/onboarding-consent-engine](../onboarding-consent-engine) — consent before paywall

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
