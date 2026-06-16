# @varshylinc/auth-social

## 0.5.0

### Added
- `appleClientId` and `googleClientId` in `AuthConfig` now accept
  `string | string[]` to support multiple simultaneous audiences
  (e.g. Apple bundle ID + Services ID, Google iOS + Web client IDs).
- Existing plain `string` values continue to work without any changes.

### Why
iPad OAuth on JobSite Intel requires accepting tokens from both
the native bundle ID and the web Services ID simultaneously.
`jose`'s `jwtVerify()` already supports `string | string[]` natively —
this change removes the single-string coercion that was blocking it.

## 0.4.2

### Patch Changes

- Re-export **`getStoredSessionToken`**, **`storeSessionToken`**, **`clearSessionToken`**, and **`fetchSession`** from `@varshylinc/auth-social/client`. These existed in `client/actions` since 0.3.x but were missing from the main client barrel, which caused Webpack/Next.js import warnings when host apps bridged social sign-in (e.g. JobSite Intel [dailylog-ai#138](https://github.com/VagishKapila/dailylog-ai/pull/138) inlined `as_session_token` helpers as a workaround). Products can remove local duplicates and import from the package again.

## 0.4.1

### Patch Changes

- **Publish fix:** Ship official social button + divider styles without Node-breaking `.css` imports — CSS is inlined at build time and injected in the browser; `.css` files are also copied to `dist/client/components/` for optional manual `@import` in app bundlers (0.4.0 omitted dist CSS entirely).

## 0.4.0

### Minor Changes

- **Breaking (visual):** `DEFAULT_AUTH_THEME.primary` changed from orange (`#ea580c`) to neutral slate (`#1F2937`). Products that relied on the orange default should pass an explicit theme.
- Added **`AuthThemeProvider`** and **`useAuthTheme()`** so auth screens re-render when theme changes (fixes first-paint orange flash when only using `setAuthTheme` in `useEffect`).
- **`SocialButtons`:** Apple and Google both shown on web by default (App Store 4.8); Apple always rendered above Google; new `providers`, `showApple`, `showGoogle`, `variant`, `mode`, and `className` props.
- **`variant="official"`** (default): Apple/Google brand-compliant buttons with bundled **AppleLogo** and **GoogleLogo** SVGs.
- Added **`AuthDivider`** component (`or continue with email` by default).
- **`SignInScreen`:** `submitButtonClassName`, `socialButtonClassName`, `containerClassName`, `inputClassName`, `dividerText`, `socialVariant` styling hooks.
- **`AuthField`:** `inputClassName` prop.
- Dev-mode console warning when Google is enabled without Apple.

## 0.3.0

### Minor Changes

- Made migrations bundler-safe by inlining SQL at build/test/typecheck time and removing runtime filesystem reads.
- Added hardened server utilities for pool creation, timeout handling, typed errors, and a boot-time `asSelfTest` check for migration/table readiness.
- Added bundled-distribution verification tests (including optional Docker-backed runtime validation) and widened test include patterns for `*.spec.ts`.

## 0.2.4

### Patch

- Re-publish to attach npm provenance attestation. No code changes.

## 0.2.3

### Patch Changes

- Also export client-safe constants and types from `./client` subpaths so they can be imported directly into "use client" components without pulling server modules. No breaking changes — root exports are unchanged.

## 0.2.2

### Patch

- Widen React peer dependency to support React 19 (`^18.0.0 || ^19.0.0`). No source changes; components work on both React 18 and 19. Fixes ERESOLVE on Next.js 15 + React 19 consumers.

## 0.2.1

### Patch Changes

- Public release polish: README, npm metadata (keywords/description/repository), and Apache-2.0 license. No code changes.
