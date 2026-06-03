# CURSOR_TOOLKIT_HARDENING_v1

Internal initiative (May 2026) to harden the Varshyl Toolkit for adoption across Varshyl products and external consumers.

## Goals

1. Fix auth-social client barrel exports (`0.4.2`)
2. Ship `@varshylinc/capacitor-build-verify` (`0.1.0`) for Capacitor bundle checks
3. Adopt capacitor-build-verify in JobSite Intel ([dailylog-ai](https://github.com/VagishKapila/dailylog-ai))
4. Document common gotchas, onboarding, and maintainer release workflow (this doc + root README)

## Prompt index

| # | Scope | Outcome |
|---|--------|---------|
| 1 | OCE two-button consent | `SignupConsentTwoButton`, `useSignupConsents` |
| 2 | auth-social publish | `0.4.0` / client exports |
| 3 | capacitor-build-verify package | npm `0.1.0`, [PR #32](https://github.com/VagishKapila/varshyl-toolkit/pull/32) |
| 4 | dailylog-ai adoption | [PR #140](https://github.com/VagishKapila/dailylog-ai/pull/140) |
| 5 | Toolkit docs | Root README, `examples/`, `CONTRIBUTING.md` |

## Canonical reference app

**JobSite Intel** — [`VagishKapila/dailylog-ai` → `apps/web`](https://github.com/VagishKapila/dailylog-ai/tree/main/apps/web)

Use it for: AuthThemeProvider placement, signup + consent wiring, static export + Capacitor scripts, `.varshyl-cap-verify.json`.
