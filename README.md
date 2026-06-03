# Varshyl Toolkit

Independent, composable npm packages for building Capacitor + web SaaS apps. Each module ships its own server logic, React UI, SQL migrations, and adapter contract — install only what you need, pin versions independently, and keep your user data in your own database.

## Packages

| Package | Version | Description |
|---|---|---|
| [@varshylinc/auth-social](packages/auth-social) | ![npm](https://img.shields.io/npm/v/@varshylinc/auth-social) | Apple, Google, and email/password auth with sessions and password reset |
| [@varshylinc/onboarding-consent-engine](packages/onboarding-consent-engine) | ![npm](https://img.shields.io/npm/v/@varshylinc/onboarding-consent-engine) | Terms/Privacy consent, GDPR/CCPA-style audit trail, signup consent block |
| [@varshylinc/mobile-payments](packages/mobile-payments) | ![npm](https://img.shields.io/npm/v/@varshylinc/mobile-payments) | RevenueCat IAP subscriptions, paywall UI, seat-aware write enforcement |
| [@varshylinc/team-management](packages/team-management) | ![npm](https://img.shields.io/npm/v/@varshylinc/team-management) | Org roster, roles, hierarchy, and admin People page |
| [@varshylinc/capacitor-build-verify](packages/capacitor-build-verify) | ![npm](https://img.shields.io/npm/v/@varshylinc/capacitor-build-verify) | Verify static export + Capacitor native bundles contain required UI strings before `cap sync` |

Each package has its own README with install instructions, quick-start examples, and entry-point tables.

Copy-paste starters live in [`examples/`](examples/).

## Quick start for a new Varshyl product

1. **Install only what you need** (each package versions independently):

   ```bash
   pnpm add @varshylinc/auth-social
   pnpm add @varshylinc/onboarding-consent-engine
   pnpm add @varshylinc/mobile-payments
   pnpm add @varshylinc/team-management
   pnpm add -D @varshylinc/capacitor-build-verify   # Capacitor + static export only
   ```

2. **Auth UI** — At the root of your React tree, wrap the app in `AuthThemeProvider` and call `configureAuth({ apiBaseUrl })` once. See [`examples/auth-social-react-signup.tsx`](examples/auth-social-react-signup.tsx) and [auth-social README](packages/auth-social/README.md).

3. **Signup consent** — Use either:
   - `SignupConsentTwoButton` for the two-button opt-in pattern, or
   - `useSignupConsents()` for fully custom UI.

   See [`examples/onboarding-consent-engine-two-button.tsx`](examples/onboarding-consent-engine-two-button.tsx).

4. **Capacitor / iOS** — If you ship a Next.js static export into Capacitor:
   - Add [`.varshyl-cap-verify.json`](examples/capacitor-build-verify-config.json) at your app root (customize `checks` for your product).
   - Add scripts (adjust paths to your app):

     ```json
     {
       "build:static": "bash scripts/build-static-export.sh",
       "verify:cap-bundle": "varshyl-cap-verify --preset capacitor-basic --enforce-fresh-sync",
       "build:ios": "pnpm build:static && npx cap sync ios && pnpm verify:cap-bundle"
     }
     ```

   Run `verify:cap-bundle` **after** every `cap sync ios`, not after `next build` alone.

5. **Reference implementation** — [**JobSite Intel**](https://github.com/VagishKapila/dailylog-ai/tree/main/apps/web) (`apps/web`) is the canonical Capacitor + toolkit wiring: auth theme, signup consent, Danger Zone bundle checks, and static export scripts.

## Common gotchas

Short troubleshooting recipes — expand in package READMEs when needed.

### Webpack: `Attempted import error: getStoredSessionToken`

**Cause:** Importing session helpers from a subpath that does not re-export them (e.g. a deep path or a mistaken barrel).

**Fix:** Always import client utilities from `@varshylinc/auth-social/client`:

```ts
import {
  getStoredSessionToken,
  storeSessionToken,
  clearSessionToken,
  fetchSession,
} from '@varshylinc/auth-social/client';
```

On **0.4.2+**, these are exported from the client entry. If you still see the warning on 0.4.2+, [open an issue](https://github.com/VagishKapila/varshyl-toolkit/issues).

### iOS Simulator shows old UI even after `pnpm build`

**Cause:** Capacitor serves `out/` (Next.js **static export**), not `.next/` (SSR dev/prod build). Updating source and running `next build` alone does not refresh what the simulator loads.

**Fix:**

1. `pnpm build:static` (or your product’s static export script)
2. `npx cap sync ios`
3. Adopt `@varshylinc/capacitor-build-verify` with `--enforce-fresh-sync` so CI/local verify fails if sync was skipped

### AuthThemeProvider styles not applying

**Cause:** `AuthThemeProvider` does not wrap the subtree that renders toolkit auth components.

**Fix:** Wrap your **app root** (or a layout that covers every auth route). Partial wrapping leaves native social-login buttons unstyled. See [packages/auth-social/README.md](packages/auth-social/README.md) for placement guidance.

### Apple Sign-In or Google Sign-In fails in iOS Simulator

**Expected behavior.** Simulator does not support real Apple ID; Google Sign-In needs Safari Auth Services that are incomplete on simulator.

**Fix:** Test social sign-in on a **physical device**. Email/password login works on simulator and is enough for App Review screen recordings.

### I shipped a fix but iOS still shows old behavior

Capacitor and Xcode cache aggressively. Use the full sequence:

1. `pnpm build:static` — rebuilds `out/`
2. `npx cap sync ios` — copies `out/` → `ios/App/App/public`
3. Xcode: **Product → Clean Build Folder** (⇧⌘K)
4. Simulator: **Device → Erase All Content and Settings**
5. **⌘R** in Xcode

Skipping any step can leave stale JS in the native shell.

## Versioning policy

| Bump | When |
|------|------|
| **Patch** `0.x.Y` | Bug fixes, internal-only changes, documentation |
| **Minor** `0.X.0` | New components, new exports, non-breaking additions |
| **Major** `X.0.0` | Breaking API changes — coordinate with all dependent products before shipping |

Pin versions per package in each product; modules do not share a single monolithic version.

## Release flow (maintainers)

1. Branch from `main` (`feat/…` or `fix/…`).
2. Implement + tests; run `pnpm verify` locally.
3. Add a changeset: `pnpm changeset` (select affected packages).
4. Open PR; merge after review.
5. On `main`: `pnpm changeset version` to bump `package.json` + changelogs.
6. Tag and publish: `bash scripts/tag-release.sh <package-name> <X.Y.Z>`, then push the tag.
7. If CHANGELOG did not auto-populate, add the version section manually.
8. Notify product owners (release link in `#releases` or your team channel).

Details: [CONTRIBUTING.md](CONTRIBUTING.md). Initiative tracker: [docs/CURSOR_TOOLKIT_HARDENING_v1.md](docs/CURSOR_TOOLKIT_HARDENING_v1.md).

## Why

- **Composable** — four independent packages; no forced bundle, no cross-imports between modules.
- **You own your data** — modules own prefixed Postgres tables (`as_`, `oce_`, `mp_`, `tm_`); your app owns users and business logic via adapters.
- **Capacitor + web** — native SDK peers (Capgo, RevenueCat) are optional; CI runs on mocks without device keys.
- **No vendor lock-in for the core** — raw SQL migrations, standard Express routers, plain React components. Swap adapters, not architectures.

## Install

```bash
npm install @varshylinc/auth-social
# … or any sibling package — see per-package README for peer deps and optional native SDKs
```

See each package README for server setup, client configuration, and adapter contracts.

## Engineering

This is a **pnpm monorepo** with strict TypeScript, raw `pg` + SQL migrations (no ORM), and per-package CI smoke gates. Before publish, `pnpm prepush -- @varshylinc/<package>` runs lint, tests, demo-host build, changeset/CHANGELOG check, exports-map validation, and a packed-tarball install test.

`apps/demo-host` is an internal verification harness — not a product. It proves modules work against real Postgres before host apps consume them.

See [ARCHITECTURE.md](ARCHITECTURE.md) for design philosophy and [CONTRIBUTING.md](CONTRIBUTING.md) for PR requirements.

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc. See [LICENSE](LICENSE).
