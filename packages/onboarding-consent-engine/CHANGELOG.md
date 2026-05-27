# @varshylinc/onboarding-consent-engine

## 0.1.0

### Minor Changes

- Initial release: consent collection, audit trail, welcome screen, empty state.
- 4 SQL migrations (0001–0004) using `oce_` table prefix.
- Server API: `runMigrations`, `createConsentModule`, `seedStandardConsents`.
- Client components: `ConsentCheckbox`, `ConsentBlock`, `WelcomeScreen`, `EmptyState`, `ConsentUpdateModal`.
- Shared types: `ConsentDefinition`, `UserConsent`, `ConsentStatus`, `AuditEntry`.
