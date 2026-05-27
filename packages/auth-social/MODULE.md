# @varshylinc/auth-social — MODULE.md

## Status

**Status:** 0.1.0 — initial, smoke-gated, mock-backed CI

## Public API

### Server (`@varshylinc/auth-social`)

- `createAuthService(pool, adapter, config): AuthService`
- `runMigrations(pool): Promise<{ applied, skipped }>`
- `MIGRATIONS_DIR` — path to SQL migration files
- `verifyAppleIdToken(idToken, clientId?)`
- `verifyGoogleIdToken(idToken, clientId?)`
- `createMockAuthService(capture?)` — in-memory impl for tests/smoke
- Types: `AuthService`, `AuthUserAdapter`, `AuthConfig`, `Session`

### Client (`@varshylinc/auth-social/client`)

- `configureAuth({ apiBaseUrl, theme?, socialProvider? })`
- `useAuth(): { state, actions, loading }`
- `SignInScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`
- `authActions` — SOREN-callable named functions
- `detectPlatform()`, `setPlatformOverride()` (test hook)
- `createMockSocialProvider()`, `createCapgoSocialProvider()` via `@varshylinc/auth-social/client/capgo`

## Host requirements

### AuthUserAdapter

The host owns the canonical user record. Implement:

```ts
interface AuthUserAdapter {
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  createUser(input: {
    email: string;
    name?: string;
    provider: 'email' | 'apple' | 'google';
  }): Promise<{ id: string }>;
  getUserById(id: string): Promise<{ id: string; email: string } | null>;
  sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
}
```

### Host API endpoints (client expects)

| Method | Path | Body |
|--------|------|------|
| POST | `/signup` | `{ email, password, name? }` → `Session` |
| POST | `/signin` | `{ email, password }` → `Session` |
| POST | `/signin/provider` | `{ provider, idToken }` → `Session` |
| POST | `/password-reset/request` | `{ email }` |
| POST | `/password-reset/confirm` | `{ token, newPassword }` |
| GET | `/session` | `Authorization: Bearer <token>` → `{ userId, email }` |
| POST | `/signout` | `{ token? }` |

Mount under a prefix (e.g. `/api/auth`) and set `configureAuth({ apiBaseUrl: '/api/auth' })`.

### AuthConfig fields

- `resetUrlBase` (required) — base URL for password reset links; module appends `?token=…`
- `sessionTtlDays` (optional, default 30)
- `appleClientId` (optional) — Apple Services ID for ID token verification
- `googleClientId` (optional) — Google OAuth client ID for ID token verification

### Postgres extensions

- `citext` (emails)
- `pgcrypto` (UUID defaults)

## Owned tables

Prefix: `as_`

| Migration | Table |
|-----------|-------|
| 0001 | `as_credentials` |
| 0002 | `as_oauth_identities` |
| 0003 | `as_sessions` |
| 0004 | `as_password_resets` |

Ledger: `as_schema_migrations` (bootstrapped by `runMigrations()`)

## Platform behavior

| Platform | Social button | Email/password |
|----------|---------------|----------------|
| iOS | Apple only | Always |
| Android | Google only | Always |
| Web | Google only | Always |

**Rationale (App Store Guideline 4.8):** Keeping Google off the iOS build avoids requiring a third-party login equivalent to Apple Sign-In. iOS offers Apple + email/password; Android/web offer Google + email/password.

## Verification limits

- Apple/Google **native** sign-in: verified on-device with real provider credentials
- Password reset **email delivery**: verified against the host's real mailer
- CI smoke: **mock-backed** (`MockAuthService` + `MockSocialProvider`) — no real keys or mail

## Version / tag plan

- Initial release: **0.1.0**
- Release tag: `auth-social-v0.1.0`

## Future / SuperLogin

This module is designed to become **Universal Varshyl Identity** without a rewrite:

- Host owns users via `AuthUserAdapter` — a future central identity provider replaces the adapter, not the screens or flows
- Opaque revocable sessions (`as_sessions`) support cross-product revocation
- OAuth identities stored separately (`as_oauth_identities`) enable linking one Apple/Google identity to one Varshyl account

Phase 3 work: shared identity service + cross-product session linking — **not** a rebuild of auth UI.

## Password hashing

Uses `@node-rs/argon2` (argon2id, prebuilt binaries). No native compile step for consumers.
