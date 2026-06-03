# CURSOR_TOOLKIT_HARDENING_v2

Toolkit hardening initiative (2026) — continuation of [v1](./CURSOR_TOOLKIT_HARDENING_v1.md).

## Prompt 6 — mobile-payments 0.3.0

**Goal:** Theme-aware paywall UI aligned with auth-social `AuthThemeProvider` pattern (conceptual parity; no cross-package imports per architecture).

**Pattern reference:** [auth-social PR #31](https://github.com/VagishKapila/varshyl-toolkit/pull/31) (0.4.2 client barrel + theming).

**Consumers:** JobSite Intel (server dep today; paywall UI optional), BrandOS (upcoming), demo-host.
