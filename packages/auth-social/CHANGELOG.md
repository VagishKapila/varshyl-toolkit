# @varshylinc/auth-social

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

- Password show/hide eye toggle on AuthField password inputs; signup consent slot (`consentSlot` prop) on SignInScreen for host-composed consent UI.

## 0.1.1

### Patch Changes

- Add `exports` map `require` conditions so `require('@varshylinc/auth-social')` resolves correctly. `0.1.0` shipped with `exports` containing only `import` and `types` conditions, causing `ERR_PACKAGE_PATH_NOT_EXPORTED` for every CommonJS consumer. This patch adds `require` alongside `import` and `types` for the three entry points: `.` (server), `./client` (React), `./client/capgo` (Capgo native provider). No source code or behavior change.

## 0.1.0 — 2026-05-27

Initial release of `@varshylinc/auth-social`.

- Apple Sign-In (iOS), Google Sign-In (Android/web), email/password (all platforms)
- Sign-In, Forgot-Password, and Reset-Password standard screens
- Server: `AuthService`, `AuthUserAdapter`, opaque revocable sessions, argon2id passwords
- Client: `useAuth`, SOREN-callable `authActions`, platform-conditional social buttons
- 4 SQL migrations with `as_` table prefix
- Mock-backed Playwright smoke (`smoke — auth-social`)
