# @varshylinc/onboarding-consent-engine

## 0.2.0

### Minor Changes

- Add `SignupConsentBlock` — hybrid signup consent UX (implied ToS/Privacy line + separate unchecked-by-default AI-training checkbox).
- Add `buildSignupConsentsPayload` and client `consentActions` for wiring signup to `recordSignupConsents`.
- Export signup consent constants (`DEFAULT_AI_TRAINING_LABEL`, `IMPLIED_SIGNUP_CONSENT_KEYS`, `AI_TRAINING_CONSENT_KEY`).

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
