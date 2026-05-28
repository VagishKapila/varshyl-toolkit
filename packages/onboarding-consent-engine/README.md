# @varshylinc/onboarding-consent-engine

> Onboarding and legal consent for web + mobile apps: Terms/Privacy acceptance, GDPR/CCPA-style data-use consent, an audit trail, and a ready-made signup consent block.

![npm](https://img.shields.io/npm/v/@varshylinc/onboarding-consent-engine)
![license](https://img.shields.io/npm/l/@varshylinc/onboarding-consent-engine)

Part of the **Varshyl Toolkit** — a set of independent, composable packages for building Capacitor + web SaaS apps.

## Screenshots

Hybrid signup consent: Terms and Privacy as linked text, plus a separate optional checkbox that starts unchecked.

![Signup consent block with Terms/Privacy links and an unchecked optional AI-training checkbox](https://varshyl-toolkit-demo.netlify.app/screenshots/signup-consent.png)

The AI-training choice is explicit and off by default — the pattern auditors expect for secondary data use.

## What it does

Collects and audits user consent at signup and onboarding. Stores an append-only consent history with version tracking when policy text changes. Ships React components for a first-run welcome screen, policy-update modals, and a hybrid signup block (implied Terms/Privacy + explicit AI-training checkbox). Your app owns authentication and user creation — this module only records consent.

## Install

```bash
npm install @varshylinc/onboarding-consent-engine
```

Peer dependency: `react` (client). Server side uses `pg` (included as a dependency).

## Quick start

**Server** — migrate, seed definitions, create the module:

```ts
import { Pool } from 'pg';
import {
  runMigrations,
  seedStandardConsents,
  createConsentModule,
} from '@varshylinc/onboarding-consent-engine';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await runMigrations(pool);
await seedStandardConsents(pool, 'YourApp');

const consent = createConsentModule({ pool });

// At signup
await consent.recordSignupConsents({
  userId: String(user.id),
  consents: [
    { key: 'terms_of_service', granted: true },
    { key: 'privacy_policy', granted: true },
    { key: 'ai_training', granted: false },
  ],
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

**Client** — signup consent block + payload helper:

```tsx
import { useState } from 'react';
import {
  SignupConsentBlock,
  buildSignupConsentsPayload,
} from '@varshylinc/onboarding-consent-engine/client';

function SignupForm() {
  const [aiTraining, setAiTraining] = useState(false);

  return (
    <>
      <SignupConsentBlock
        termsUrl="/legal/terms"
        privacyUrl="/legal/privacy"
        aiTrainingChecked={aiTraining}
        onAiTrainingChange={setAiTraining}
        actionPhrase="creating your account"
      />
      {/* on submit: buildSignupConsentsPayload({ aiTrainingGranted: aiTraining }) */}
    </>
  );
}
```

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/onboarding-consent-engine` | `runMigrations`, `createConsentModule`, `seedStandardConsents`, `STANDARD_CONSENTS`, `applyProductName`, `buildSignupConsentsPayload`, types |
| `@varshylinc/onboarding-consent-engine/client` | `ConsentCheckbox`, `ConsentBlock`, `WelcomeScreen`, `EmptyState`, `ConsentUpdateModal`, `SignupConsentBlock`, `consentActions`, `recordSignupConsentsAction`, … |

## Database

Bring your own Postgres. Call `runMigrations(pool)` on boot, then `seedStandardConsents(pool, productName)` (idempotent). Tables use the `oce_` prefix (`oce_consent_definitions`, `oce_user_consents`, `oce_consent_version_log`). `user_id` is stored as `TEXT` — stringify your app's primary key before passing it in.

## Theming

Components ship with neutral default styling. Customize copy and legal links via props (`legalLinks`, `productName`, `aiTrainingLabel`, etc.).

## See also

- [@varshylinc/auth-social](../auth-social) — pass `SignupConsentBlock` into `SignInScreen` via `consentSlot`
- [@varshylinc/team-management](../team-management) — org onboarding after account creation
- [@varshylinc/mobile-payments](../mobile-payments) — subscription paywall after onboarding

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
