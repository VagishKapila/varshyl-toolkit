# @varshylinc/onboarding-consent-engine

Shared consent collection, audit trail, welcome screen, and empty state for all Varshyl products.

## Installation

```bash
pnpm add @varshylinc/onboarding-consent-engine
```

## Server usage

```typescript
import { createConsentModule, runMigrations, seedStandardConsents } from '@varshylinc/onboarding-consent-engine';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await runMigrations(pool);
await seedStandardConsents(pool, 'ConstructInv');

const consent = createConsentModule({ pool });

// Record consent at signup
const records = await consent.recordSignupConsents({
  userId: String(user.id),
  consents: [
    { key: 'terms_of_service', granted: true },
    { key: 'privacy_policy', granted: true },
    { key: 'marketing_emails', granted: false },
  ],
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

// Check if user needs to re-consent
const pending = await consent.needsConsentUpdate(String(user.id));
```

## Client usage

```tsx
import { WelcomeScreen } from '@varshylinc/onboarding-consent-engine/client';

// Fetch definitions from your API (GET /api/consent/definitions)
<WelcomeScreen
  productName="ConstructInv"
  requiredConsents={requiredDefs}
  optionalConsents={optionalDefs}
  value={grantedKeys}
  onChange={setGrantedKeys}
  onContinue={handleContinue}
/>
```

## Migrations

Run `runMigrations(pool)` on server boot. Idempotent — safe to call on every restart.

Tables: `oce_schema_migrations`, `oce_consent_definitions`, `oce_user_consents`, `oce_consent_version_log`.

## `user_id` contract

`user_id` is stored as `TEXT`. Products stringify their primary key before passing it:
- **ConstructInv** — `String(user.id)` (integer PK)
- **DailyLog** — UUID passed as-is
