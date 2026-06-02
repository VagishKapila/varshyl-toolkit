# @varshylinc/auth-social

> Drop-in authentication for Capacitor + web apps: Apple, Google, and email/password sign-in with sessions, password reset, a show/hide toggle, and your own user store via an adapter.

![npm](https://img.shields.io/npm/v/@varshylinc/auth-social)
![license](https://img.shields.io/npm/l/@varshylinc/auth-social)

Part of the **Varshyl Toolkit** — a set of independent, composable packages for building Capacitor + web SaaS apps.

## What it does

Handles sign-in and sign-up for mobile and web apps without owning your user table. You implement a small adapter for your existing user store; the module manages credentials, OAuth identities, sessions, and password-reset tokens in its own Postgres tables.

Ships ready-made React screens with **Sign in with Apple** and **Sign in with Google** (official logos + brand styling), an **AuthDivider**, email/password fields with a password visibility toggle, and product theming via **AuthThemeProvider**.

> ⚠️ **Apple brand order:** Apple's guidelines require Sign in with Apple to appear **above** other third-party sign-in options on iOS apps. `SocialButtons` automatically enforces Apple-first ordering when both providers are shown.

> ⚠️ **App Store 4.8:** If you offer Google (or any third-party sign-in), you must also offer Sign in with Apple on iOS. `SocialButtons` shows both on web and native by default; disabling Apple while keeping Google logs a dev-mode warning.

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

**Client** — wrap your app root in `AuthThemeProvider`, configure once, render the sign-in screen:

```tsx
import {
  AuthThemeProvider,
  configureAuth,
  SignInScreen,
  useAuth,
} from '@varshylinc/auth-social/client';

const JOBSITE_THEME = {
  primary: '#3A6B5F',
  primaryHover: '#2D544A',
  surface: '#FAF7F0',
};

configureAuth({ apiBaseUrl: '/api/auth' });

function App() {
  return (
    <AuthThemeProvider theme={JOBSITE_THEME}>
      <LoginPage />
    </AuthThemeProvider>
  );
}

function LoginPage() {
  const { actions } = useAuth();
  return (
    <SignInScreen
      actions={actions}
      submitButtonClassName="my-product-submit"
      onSuccess={() => (window.location.href = '/app')}
    />
  );
}
```

Standard auth layout:

```tsx
<SocialButtons variant="official" mode="signIn" />
<AuthDivider text="or continue with email" />
{/* email + password fields */}
```

## Theming

- **Default theme** is neutral slate (`#1F2937`) — not orange. Brand colors are your choice.
- Prefer **`AuthThemeProvider`** at the app root so screens pick up theme on first paint (no `useEffect` + `setAuthTheme` race).
- **`setAuthTheme()`** still works for imperative overrides outside React.
- **`SignInScreen`** accepts `submitButtonClassName`, `socialButtonClassName`, `containerClassName`, `inputClassName`, and `dividerText`.

## SocialButtons props

| Prop | Default | Description |
|------|---------|-------------|
| `providers` | `['apple','google']` | Which providers to consider |
| `showApple` | `true` when Google is on | Set `false` only if you intentionally omit Apple (dev warning) |
| `showGoogle` | `true` | Toggle Google button |
| `variant` | `'official'` | `'official'` = Apple/Google brand buttons + logos; `'default'` = themed neutral |
| `mode` | `'signIn'` | `'signUp'` changes button copy |

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/auth-social` | `createAuthService`, `runMigrations`, `MIGRATIONS_DIR`, `verifyAppleIdToken`, `verifyGoogleIdToken`, `createMockAuthService`, types |
| `@varshylinc/auth-social/client` | `AuthThemeProvider`, `useAuthTheme`, `SignInScreen`, `SocialButtons`, `AuthDivider`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `AuthField`, `AppleLogo`, `GoogleLogo`, `authActions`, `setAuthTheme`, `createMockSocialProvider`, … |
| `@varshylinc/auth-social/client/capgo` | `createCapgoSocialProvider` — native Apple/Google via Capgo (optional peer) |

## Database

Bring your own Postgres. Call `runMigrations(pool)` on server boot — idempotent, safe every startup. Tables use the `as_` prefix (`as_credentials`, `as_oauth_identities`, `as_sessions`, `as_password_resets`). Requires `citext` and `pgcrypto` extensions.

## See also

- [@varshylinc/onboarding-consent-engine](../onboarding-consent-engine) — compose consent UI into `SignInScreen` via the `consentSlot` prop
- [@varshylinc/team-management](../team-management) — org roster keyed to the same `userId`
- [@varshylinc/mobile-payments](../mobile-payments) — seat-aware subscriptions

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
