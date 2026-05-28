# @varshylinc/mobile-payments
## 0.1.3

### Patch

- Widen React peer dependency to support React 19 (`^18.0.0 || ^19.0.0`). No source changes; components work on both React 18 and 19. Fixes ERESOLVE on Next.js 15 + React 19 consumers.

## 0.1.2

### Patch Changes

- Public release polish: README, npm metadata (keywords/description/repository), and Apache-2.0 license. No code changes.

## 0.1.1

### Patch Changes

- Move @revenuecat/purchases-capacitor to optional peer dependency and load it lazily so the package can be imported in non-Capacitor environments without the SDK installed. Fixes ERR_MODULE_NOT_FOUND on /client/revenuecat entry point.

## 0.1.0

### Minor Changes

- Initial release of `@varshylinc/mobile-payments` v0.1.0.

  - Seat-aware in-app subscription module (Phase 1 individual IAP via RevenueCat)
  - Server SubscriptionStore with `mp_*` migrations, `assertCanWrite`, RevenueCat webhook
  - Client PaywallScreen, FeatureGate, ReadOnlyBanner, MockSubscriptionService
  - Mock-backed Playwright smoke gate for demo-host
