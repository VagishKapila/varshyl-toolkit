# @varshylinc/auth-social

> Drop-in authentication for Capacitor + web apps: Apple, Google, and email/password sign-in with sessions, password reset, a show/hide toggle, and your own user store via an adapter.

![npm](https://img.shields.io/npm/v/@varshylinc/auth-social)
![license](https://img.shields.io/npm/l/@varshylinc/auth-social)

Part of the **Varshyl Toolkit** — a set of independent, composable packages for building Capacitor + web SaaS apps.

## Screenshots

Ready-made sign-in screen with Google and email/password — drop it into your app and theme it.

![Sign-in screen with Google button, email and password fields, and a show/hide password toggle](https://raw.githubusercontent.com/VagishKapila/varshyl-toolkit/chore/public-polish/docs/readme-screenshots/auth-social-sign-in.png)

Tap the eye icon to reveal or hide the password — helpful on mobile keyboards.

![Password field with the visibility toggle showing plain text](https://raw.githubusercontent.com/VagishKapila/varshyl-toolkit/chore/public-polish/docs/readme-screenshots/auth-social-eye-toggle.png)

Forgot-password and reset-password screens ship with the package — wire your adapter’s email sender and you’re done.

![Forgot password screen — user enters email to receive a reset link](https://raw.githubusercontent.com/VagishKapila/varshyl-toolkit/chore/public-polish/docs/readme-screenshots/auth-social-forgot-password.png)

![Reset password screen — user sets a new password from the email link](https://raw.githubusercontent.com/VagishKapila/varshyl-toolkit/chore/public-polish/docs/readme-screenshots/auth-social-reset-password.png)

## What it does

Handles sign-in and sign-up for mobile and web apps without owning your user table. You implement a small adapter for your existing user store; the module manages credentials, OAuth identities, sessions, and password-reset tokens in its own Postgres tables. Ships ready-made React screens with platform-aware social buttons (Apple on iOS, Google on Android/web) and an email/password flow with a password visibility toggle.

## Install

```bash
npm install @varshylinc/auth-social
```

Peer dependencies: `pg` (server) and `react` (client).

For native Apple/Google sign-in on device builds, install `@capgo/capacitor-social-login` and import the Capgo provider from `@varshylinc/auth-social/client/capgo`. Web and CI builds can use the built-in mock provider — no native SDK required.

## Quick start

**Server** — run migrations, create the auth service, mount your routes:

```ts
import { Pool } from 'pg';
import { createAuthService, runMigrations } from '@varshylinc/auth-social';
import type { AuthUserAdapter } from '@varshylinc/auth-social';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await runMigrations(pool);

const adapter: AuthUserAdapter = {
  findUserByEmail: (email) => yourDb.findByEmail(email),
  createUser: (input) => yourDb.createUser(input),
  getUserById: (id) => yourDb.getUser(id),
  sendPasswordResetEmail: ({ to, resetUrl }) => yourMailer.send(to, resetUrl),
};

const auth = createAuthService(pool, adapter, {
  resetUrlBase: 'https://yourapp.com/reset-password',
});
```

**Client** — configure once, render the sign-in screen:

```tsx
import { configureAuth, SignInScreen, useAuth, setAuthTheme } from '@varshylinc/auth-social/client';

configureAuth({ apiBaseUrl: '/api/auth' });
setAuthTheme({ primary: '#2563eb' });

function LoginPage() {
  const { actions } = useAuth();
  return (
    <SignInScreen
      actions={actions}
      onSuccess={() => (window.location.href = '/app')}
    />
  );
}
```

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/auth-social` | `createAuthService`, `runMigrations`, `MIGRATIONS_DIR`, `verifyAppleIdToken`, `verifyGoogleIdToken`, `createMockAuthService`, types |
| `@varshylinc/auth-social/client` | `configureAuth`, `useAuth`, `SignInScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `AuthField`, `authActions`, `setAuthTheme`, `createMockSocialProvider`, … |
| `@varshylinc/auth-social/client/capgo` | `createCapgoSocialProvider` — native Apple/Google via Capgo (optional peer) |

## Database

Bring your own Postgres. Call `runMigrations(pool)` on server boot — idempotent, safe every startup. Tables use the `as_` prefix (`as_credentials`, `as_oauth_identities`, `as_sessions`, `as_password_resets`). Requires `citext` and `pgcrypto` extensions.

## Theming

Themeable via `setAuthTheme()` or `configureAuth({ theme })`. Ships a neutral default (`DEFAULT_AUTH_THEME`).

## See also

- [@varshylinc/onboarding-consent-engine](../onboarding-consent-engine) — compose `SignupConsentBlock` into `SignInScreen` via the `consentSlot` prop
- [@varshylinc/team-management](../team-management) — org roster keyed to the same `userId`
- [@varshylinc/mobile-payments](../mobile-payments) — seat-aware subscriptions

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
