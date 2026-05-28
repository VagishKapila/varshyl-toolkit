# @varshylinc/mobile-payments — MODULE.md

## Status

**0.1.0 — Phase 1 individual IAP, seat-aware, smoke-gated, mock-backed CI**

## Public API

### Server (`@varshylinc/mobile-payments`)

- `createSubscriptionStore(pool, config): SubscriptionStore`
- `runMigrations(pool): Promise<{ applied, skipped }>`
- `MIGRATIONS_DIR` — path to packaged SQL migration files
- `assertCanWrite(store, orgId, userId): Promise<boolean>` — unified write guard
- `getAccessModeForUser(store, orgId, userId): Promise<AccessMode>`
- `createRevenueCatWebhookHandler(store, config)` — mount on host Express app
- `createMockSubscriptionStore()` — in-memory store for tests
- `emitSubscriptionEvent`, `assignBuyerSeat` — helpers for host/sync flows
- Types: `SubscriptionStore`, `PaymentsConfig`, `SubscriptionStatus`, `NormalizedEvent`

### Client (`@varshylinc/mobile-payments/client`)

- `configureSubscriptions({ service?, theme?, config })`
- `useSubscription(): { isActive, isInTrial, status, expiresAt, accessMode, seats, loading, actions, refresh }`
- `PaywallScreen`, `FeatureGate`, `ReadOnlyBanner`, `RestoreButton`
- `subscriptionActions` — SOREN-callable named functions
- `createMockSubscriptionService()`, `MockSubscriptionService`
- `SubscriptionService` interface

### RevenueCat provider (`@varshylinc/mobile-payments/client/revenuecat`)

- `createRevenueCatSubscriptionService(clientConfig, product): SubscriptionService`
- Requires peer `@revenuecat/purchases-capacitor` on device builds only

## Host requirements

### PaymentsConfig

```ts
interface PaymentsConfig {
  product: {
    productSlug: string;
    entitlementId: string;        // default: 'premium'
    monthlyProductId: string;     // e.g. 'jobsiteintel_premium_monthly'
    seatPricing?: { minSeats: number; pricePerSeat: number }[]; // Phase 2 placeholder
  };
  revenueCatWebhookSecret?: string;  // env — never in code
  onSubscriptionEvent?: (event: NormalizedEvent) => void;
}
```

### RevenueCat webhook

Mount `createRevenueCatWebhookHandler` at a host-chosen path (e.g. `/api/payments/webhooks/revenuecat`). Set `Authorization: Bearer <secret>` in RevenueCat dashboard; pass the same value via `revenueCatWebhookSecret` or env.

### assertCanWrite

Call **before every product write API**. Client `FeatureGate` is UX only; server enforcement is authoritative.

### Postgres

Required. Run `runMigrations(pool)` on boot (idempotent).

## Owned tables

Prefix: `mp_`

| Migration | Table |
|-----------|-------|
| 0001 | `mp_subscriptions` — org-keyed current state (`seats`, `status`, `store`) |
| 0002 | `mp_subscription_events` — append-only ledger |
| 0003 | `mp_seat_assignments` — org → user seat occupancy |

## Access logic

| Status | canRead | canWrite (per seat) |
|--------|---------|---------------------|
| `trial` | always | true if user occupies a seat |
| `active` | always | true if user occupies a seat |
| `lapsed` | always | false for everyone |
| `none` | always | product default (Job Site Intel: full during v1.0 dark launch) |

## Seat model

- Keyed by host-provided `orgId` (RevenueCat app user id).
- `mp_subscriptions.seats` = billed seat quantity (default 1).
- `mp_seat_assignments` maps occupied seats.
- Phase 1 individual: purchase sets `seats = 1`, buyer auto-assigned.
- Phase 2 team: Stripe web purchase sets `seats = N`; team-management assigns users.

## SuperLogin event contract

```ts
type NormalizedEvent = {
  product_slug: string;
  amount: number | null;
  status: string;
  timestamp: string;
};
```

Emitted on purchase, renewal, trial-start, lapse, restore via `onSubscriptionEvent` and persisted to `mp_subscription_events`.

## Verification limits

- Real StoreKit / Play Billing flows: **on-device manual verification only**.
- CI smoke: **MockSubscriptionService + mock store only** (no real keys).
- Check name: `smoke — mobile-payments`

## Dashboard setup (Vagish — not code)

1. **App Store Connect:** subscription product, $35/mo, 90-day Introductory Offer.
2. **Play Console:** matching subscription/base plan/offer, **same product id**.
3. **RevenueCat:** project, both stores linked to `premium` entitlement, offering configured, public API key + webhook secret.

## Future / Phase 2 — Stripe web seats + volume discounts

**NOT built in v0.1.0.** Design seams included now:

- Companies buy **N seats on web** (Stripe); iOS app reads entitlement only — **no link-out to web purchase** (Apple rule).
- Add `stripe-webhook.ts` sibling to RevenueCat webhook; writes same `SubscriptionStore`.
- `mp_subscriptions.store` already allows `'stripe'`.
- `seatPricing` placeholder in config for volume tiers (exact numbers TBD).
- Seat assignment enforcement via team-management; `assertCanWrite` unchanged.
- Open placement: extend this module server-side (recommended) vs sibling `@varshylinc/web-billing`.

## Version / tag plan

- **0.1.0** — initial Phase 1 release
- Tag: `mobile-payments-v0.1.0`
