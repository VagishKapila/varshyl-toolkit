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

## Choosing your consent UX

### Option 1 — Checkbox (default)

```tsx
import { SignupConsentBlock } from '@varshylinc/onboarding-consent-engine/client';

<SignupConsentBlock
  termsUrl="https://yoursite.com/terms"
  privacyUrl="https://yoursite.com/privacy"
  aiTrainingChecked={aiTraining}
  onAiTrainingChange={setAiTraining}
  actionPhrase="signing up"
/>
```

### Option 2 — Two-button choice (higher opt-in)

```tsx
import {
  SignupConsentTwoButton,
  useSignupConsents,
} from '@varshylinc/onboarding-consent-engine/client';

function SignupForm() {
  const { record, isRecording } = useSignupConsents();

  const handleSubmit = async (aiTrainingGranted: boolean) => {
    const user = await createUser(/* … */);
    await record({
      userId: user.id,
      tosGranted: true,
      privacyGranted: true,
      aiTrainingGranted,
    });
  };

  return (
    <SignupConsentTwoButton
      tosUrl="https://yoursite.com/terms"
      privacyUrl="https://yoursite.com/privacy"
      questionText="Help train Soren on real construction work?"
      descriptionText="Your anonymized photos and voice notes make Soren smarter for every contractor."
      noButtonText="No, just sign me up"
      yesButtonText="Yes, sign up & count me in"
      onSubmit={handleSubmit}
      isSubmitting={isRecording}
    />
  );
}
```

Override styling with `noButtonClassName`, `yesButtonClassName`, and `containerClassName` (Tailwind or your design system). Default minimal CSS ships with the component.

### Option 3 — Fully custom UI (use the hook)

```tsx
import { useSignupConsents } from '@varshylinc/onboarding-consent-engine/client';

function MyCustomConsent() {
  const { record, isRecording, error } = useSignupConsents({
    onSuccess: (userId) => router.push('/dashboard'),
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      {/* Your custom UI — modals, cards, native buttons, etc. */}
      <button
        type="button"
        disabled={isRecording}
        onClick={() =>
          record({
            userId,
            tosGranted: true,
            privacyGranted: true,
            aiTrainingGranted: true,
          })
        }
      >
        Continue
      </button>
      {error && <p>{error.message}</p>}
    </div>
  );
}
```

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/onboarding-consent-engine` | `runMigrations`, `createConsentModule`, `seedStandardConsents`, `STANDARD_CONSENTS`, `applyProductName`, `buildSignupConsentsPayload`, types |
| `@varshylinc/onboarding-consent-engine/client` | `SignupConsentBlock`, `SignupConsentTwoButton`, `useSignupConsents`, `recordSignupConsents`, `ConsentCheckbox`, `WelcomeScreen`, … |

## Database

Bring your own Postgres. Call `runMigrations(pool)` on boot, then `seedStandardConsents(pool, productName)` (idempotent). Tables use the `oce_` prefix (`oce_consent_definitions`, `oce_user_consents`, `oce_consent_version_log`). `user_id` is stored as `TEXT` — stringify your app's primary key before passing it in.

## Theming

Components ship with neutral default styling. Customize copy and legal links via props (`legalLinks`, `productName`, `aiTrainingLabel`, etc.).

## See also

- [@varshylinc/auth-social](../auth-social) — pass `SignupConsentBlock` into `SignInScreen` via `consentSlot`
- [@varshylinc/team-management](../team-management) — org onboarding after account creation
- [@varshylinc/mobile-payments](../mobile-payments) — subscription paywall after onboarding

## What developers usually add next

These are not required — but they pair naturally:

💡 @varshylinc/auth-social — use SignUpForm alongside
this package for a complete sign up and consent flow.

💡 @varshylinc/mobile-payments — capture payment
consent at the same time as your terms consent.

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
