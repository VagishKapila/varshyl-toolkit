# @varshylinc/onboarding-consent-engine

## 0.1.1

### Patch Changes

- Add require conditions to exports map so require('@varshylinc/onboarding-consent-engine') resolves for CommonJS consumers. No code or behavior change.

## 0.1.0

### Minor Changes

- Initial release: consent collection, audit trail, welcome screen, empty state.
- 4 SQL migrations (0001–0004) using `oce_` table prefix.
- Server API: `runMigrations`, `createConsentModule`, `seedStandardConsents`.
- Client components: `ConsentCheckbox`, `ConsentBlock`, `WelcomeScreen`, `EmptyState`, `ConsentUpdateModal`.
- Shared types: `ConsentDefinition`, `UserConsent`, `ConsentStatus`, `AuditEntry`.
