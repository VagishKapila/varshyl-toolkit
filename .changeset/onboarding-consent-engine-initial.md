---
"@varshylinc/onboarding-consent-engine": minor
---

Initial release of `@varshylinc/onboarding-consent-engine` v0.1.0.

Consent collection, audit trail, welcome screen, and empty state for Varshyl products.

- 4 SQL migrations (0001–0004) with `oce_` table prefix, raw pg Pool, no ORM
- Server: `runMigrations`, `seedStandardConsents`, `createConsentModule`
- Server lib: `recordConsent`, `recordSignupConsents`, `hasUserConsented`, `needsConsentUpdate`, `getCurrentConsents`, `getAuditTrail`, `getUserLatestConsents`
- Client components: `ConsentCheckbox`, `ConsentBlock`, `WelcomeScreen`, `EmptyState`, `ConsentUpdateModal`
- Shared types: `ConsentDefinition`, `UserConsent`, `ConsentStatus`, `AuditEntry`
- `user_id` stored as TEXT — no FK, no format constraint
- `applyProductName()` called at seed time only; components display `display_text` from DB verbatim
- MODULE.md establishes precedent for all future `packages/*` documentation
