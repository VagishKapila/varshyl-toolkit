# MODULE: @varshylinc/onboarding-consent-engine

**Status:** ✅ RELEASED — v0.1.0  
**Git tag:** `onboarding-consent-engine-v0.1.0`  
**First module to ship MODULE.md** — this document sets the precedent for all future `packages/*` in varshyl-toolkit.

---

## Overview

Shared consent collection, audit trail, welcome screen, and empty state. Intended to be adopted by all Varshyl products at onboarding.

---

## Public API

### Server (import from `@varshylinc/onboarding-consent-engine`)

| Export | Signature | Description |
|--------|-----------|-------------|
| `runMigrations` | `(pool: Pool, logger?) → Promise<{applied, skipped}>` | Apply 0001–0004 migrations idempotently |
| `createConsentModule` | `(config: ConsentModuleConfig) → ConsentModule` | Create module instance |
| `seedStandardConsents` | `(pool: Pool, productName: string) → Promise<void>` | Upsert standard consent definitions with product name applied |
| `STANDARD_CONSENTS` | `readonly array` | Canonical 4-consent set (ToS, Privacy, Marketing, AI Training) |
| `applyProductName` | `(template, productName) → string` | Substitute `{{PRODUCT_NAME}}` at seed time only |

### ConsentModule instance methods

| Method | Description |
|--------|-------------|
| `recordConsent(input)` | Insert one consent record |
| `recordSignupConsents(input)` | Insert one record per consent key at signup |
| `hasUserConsented(userId, key)` | Latest grant status for one key |
| `needsConsentUpdate(userId)` | Required definitions not yet at current version |
| `getCurrentConsents(userId)` | Latest status for all definitions |
| `getAuditTrail(userId, limit?)` | Full consent history, newest-first |
| `getUserLatestConsents(userIds[])` | Batch latest status by user |

### Client (import from `@varshylinc/onboarding-consent-engine/client`)

| Component | Props | Description |
|-----------|-------|-------------|
| `ConsentCheckbox` | `{id, checked, onChange, label, required?, legalUrl?, disabled?}` | Single checkbox with label |
| `ConsentBlock` | `{requiredConsents, optionalConsents, value, onChange, productName, legalLinks?, disabled?}` | Grouped checkbox list |
| `WelcomeScreen` | `{productName, requiredConsents, optionalConsents, value, onChange, onContinue, legalLinks?, loading?, logo?}` | Full-page first-run screen |
| `EmptyState` | `{title?, description?, action?}` | Empty state placeholder |
| `ConsentUpdateModal` | `{productName, updatedConsents, value, onChange, onAccept, loading?, legalLinks?}` | Modal for policy updates |

### Shared types (import from `@varshylinc/onboarding-consent-engine`)

`ConsentDefinition`, `UserConsent`, `ConsentVersionLog`, `RecordConsentInput`, `RecordSignupConsentsInput`, `ConsentStatus`, `AuditEntry`, `ConsentModuleAdapter`, `ConsentModuleConfig`

---

## Owned Tables

All tables use the `oce_` prefix to namespace away from other modules.

| Table | Purpose |
|-------|---------|
| `oce_schema_migrations` | Migration ledger (idempotency) |
| `oce_consent_definitions` | Consent templates — one row per consent type |
| `oce_user_consents` | Immutable append-only consent records |
| `oce_consent_version_log` | Version history when a definition's text changes |

**`user_id` is `TEXT` — no FK, no constraint on format.** Products stringify their own PK before passing it in (see Adapter Contract below).

---

## Host Requirements

The consuming app (e.g., `apps/demo-host`) must:

1. Provide a PostgreSQL `Pool` from `pg`.
2. Call `await runMigrations(pool)` on startup before serving requests.
3. Call `await seedStandardConsents(pool, 'ProductName')` on startup (idempotent).
4. Expose an API route (e.g., `GET /api/consent/definitions`) to serve definitions to the client.
5. Expose an API route (e.g., `POST /api/consent/record`) that calls `recordSignupConsents` or `recordConsent`.

No email-sending, no authentication, no account creation. This module only collects and audits consent.

---

## Adapter Contract

```typescript
interface ConsentModuleAdapter {
  onConsentRecorded?: (userId: string, key: string, granted: boolean) => void | Promise<void>;
}
```

Optional hook called after every consent record is inserted. Use for analytics, CRM sync, etc.

**`user_id` format by product:**

| Product | PK type | What to pass |
|---------|---------|--------------|
| ConstructInv | integer | `String(user.id)` |
| DailyLog | UUID string | pass as-is |

---

## Version / Git Tag Plan

Releases follow SemVer with the prefix `onboarding-consent-engine-vX.Y.Z`.

| Release | Tag | Notes |
|---------|-----|-------|
| v0.1.0 | `onboarding-consent-engine-v0.1.0` | Initial release |
| v0.2.0 | `onboarding-consent-engine-v0.2.0` | Planned: IP/UA encryption via libsodium sealed box |

---

## Retroactive Adoption Guide

For products that already have users and want to adopt this module:

1. Run `runMigrations(pool)` — creates tables idempotently, no data loss.
2. Run `seedStandardConsents(pool, 'YourProductName')` — upserts definitions.
3. Wrap your signup handler to call `recordSignupConsents` for new users.
4. For existing users: call `needsConsentUpdate(userId)` at login — redirect to `ConsentUpdateModal` if non-empty.
5. Existing users who never consented will always appear in `needsConsentUpdate` until they go through the modal. This is intentional — it surfaces the gap for retroactive collection.

---

## Future Work (v0.2.0+)

- **IP/UA encryption** — encrypt `ip_address` and `user_agent` at rest using libsodium sealed box. Not in v0.1.0. No encryption key env var required yet.
- **Consent export** — `exportUserConsents(userId)` for GDPR data portability.
- **Consent withdrawal** — `withdrawConsent(userId, key)` records a revocation.
