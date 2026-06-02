# @varshylinc/onboarding-consent-engine

## 0.4.0

### Minor Changes

- Add `SignupConsentTwoButton` — two equal-weight signup buttons for AI training opt-in (ToS/Privacy implied consent line above; no checkbox). Ships minimal default CSS; products override via `*ClassName` props.
- Add `useSignupConsents()` headless hook with `record()`, `isRecording`, and `error` for custom consent UI.
- Add client `recordSignupConsents()` helper that throws on failure (wraps `recordSignupConsentsAction`). Export from `./client`.
- README: new "Choosing your consent UX" section (checkbox vs two-button vs custom hook).

## 0.3.0

### Minor Changes

- Inline migration SQL at build time (`migrations.generated.ts`) so bundled consumers (tsup, esbuild, webpack) no longer read `.sql` files via `import.meta.url` paths — fixes migration failures/hangs in production bundles.
- Add `oceSelfTest()` boot-time wiring check returning `{ migrationsOk, seedOk, consentKeysFound }`.
- Add `createOcePool()` with 10s default connection timeout; `recordSignupConsents` enforces 5s operation timeout (both configurable via `ConsentModuleConfig`).
- Throw structured `OceError` codes: `OCE_MIGRATIONS_FAILED`, `OCE_UNKNOWN_KEY`, `OCE_TIMEOUT` — operations fail fast instead of hanging.
- Add `tests/bundled.spec.ts` regression test (tsup bundle + Testcontainers Postgres).
- **Audit note:** `auth-social`, `mobile-payments`, and `team-management` still load migrations via `fs` + `import.meta.url`; same bundler risk — follow-up recommended.

## 0.2.3

### Patch Changes

- Also export client-safe constants and types from `./client` subpaths so they can be imported directly into "use client" components without pulling server modules. No breaking changes — root exports are unchanged.

## 0.2.2

### Patch

- Widen React peer dependency to support React 19 (`^18.0.0 || ^19.0.0`). No source changes; components work on both React 18 and 19. Fixes ERESOLVE on Next.js 15 + React 19 consumers.

## 0.2.1

### Patch Changes

- Public release polish: README, npm metadata (keywords/description/repository), and Apache-2.0 license. No code changes.

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
