# @varshylinc/mobile-payments

## 0.5.1
### Patch Changes
- Add VERSION constant to main barrel export

## 0.5.0

### Minor Changes

- hasGrantedAccess() — check DB grant before RevenueCat paywall
- grantAccess() / revokeAccess() / listGrants() — server functions
- createPromoCode() / redeemPromoCode() — promo code system
- grantsRouter() — mount-ready Express router for admin API
- useGrants() — React hook for admin UI integration
- GrantsAdmin — drop-in React admin panel component
- DB migration 003_granted_access.sql (3 new tables)

## 0.4.0

### Patch Changes

- Fix CSS tarball bug — inline styles instead of ESM .css import
- Paywall copy updated for Apple 3.1.1 + Google Play Billing compliance

## 0.3.0

### Minor Changes

- **AuthTheme-compatible theming:** `PaymentsThemeProvider` and `usePaymentsTheme()` mirror auth-social `AuthThemeProvider` (same token shape; pass one `theme` object to both providers — modules do not cross-import per architecture).
- **CSS variables + `PaywallStyles.css`:** Paywall, restore, read-only banner, and feature gate use `--mp-*` variables with fallbacks; default stylesheet ships in `dist/client/components/`.
- **`*ClassName` override props** on `PaywallScreen`, `RestoreButton`, `ReadOnlyBanner`, and `FeatureGate` for product Tailwind/layout hooks.

### Migration

Existing consumers do not need to change anything. Default visuals match prior `DEFAULT_PAYMENTS_THEME` / inline styles. To opt into themed paywalls, wrap your app in `<PaymentsThemeProvider theme={…}>` (use the same theme as `<AuthThemeProvider>`). Legacy `configureSubscriptions({ theme })` and `SubscriptionTheme` keys remain supported.

## 0.2.0

### Minor Changes

- Switch migration execution to bundler-safe inline SQL generation (`scripts/inline-migrations.ts` -> `src/server/migrations.generated.ts`) so runtime never reads migration files from disk.
- Add server resiliency and boot checks (`MpError`, timeout wrappers, `createMpPool`, `mpSelfTest`) and expose them from package exports.
- Add bundled distribution verification (`tests/bundled.spec.ts`) and test config updates to validate inlined migrations in tsup output.

## 0.1.4

### Patch Changes

- Also export client-safe constants and types from `./client` subpaths so they can be imported directly into "use client" components without pulling server modules. No breaking changes — root exports are unchanged.

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
