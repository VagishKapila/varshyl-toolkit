# @varshylinc/auth-social

Shared sign-in system for Varshyl products: Apple Sign-In (iOS), Google Sign-In (Android/web), and email/password on all platforms.

## Install

```bash
npm install @varshylinc/auth-social
```

## Server

```ts
import { Pool } from 'pg';
import { createAuthService, runMigrations } from '@varshylinc/auth-social';

await runMigrations(pool);
const auth = createAuthService(pool, hostAdapter, {
  resetUrlBase: 'https://yourapp.com/reset-password',
});
```

## Client

```tsx
import { configureAuth, SignInScreen, useAuth } from '@varshylinc/auth-social/client';

configureAuth({ apiBaseUrl: '/api/auth' });

function LoginPage() {
  const { actions } = useAuth();
  return <SignInScreen actions={actions} onSuccess={() => window.location.href = '/app'} />;
}
```

See `MODULE.md` for the full adapter contract and host API requirements.
