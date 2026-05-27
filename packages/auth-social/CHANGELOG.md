# @varshylinc/auth-social

## 0.1.0 — 2026-05-27

Initial release of `@varshylinc/auth-social`.

- Apple Sign-In (iOS), Google Sign-In (Android/web), email/password (all platforms)
- Sign-In, Forgot-Password, and Reset-Password standard screens
- Server: `AuthService`, `AuthUserAdapter`, opaque revocable sessions, argon2id passwords
- Client: `useAuth`, SOREN-callable `authActions`, platform-conditional social buttons
- 4 SQL migrations with `as_` table prefix
- Mock-backed Playwright smoke (`smoke — auth-social`)
