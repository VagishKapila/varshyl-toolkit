# Varshyl Toolkit

Independent, composable npm packages for building Capacitor + web SaaS apps. Each module ships its own server logic, React UI, SQL migrations, and adapter contract — install only what you need, pin versions independently, and keep your user data in your own database.

## Packages

| Package | Version | Description |
|---|---|---|
| [@varshylinc/auth-social](packages/auth-social) | ![npm](https://img.shields.io/npm/v/@varshylinc/auth-social) | Apple, Google, and email/password auth with sessions and password reset |
| [@varshylinc/onboarding-consent-engine](packages/onboarding-consent-engine) | ![npm](https://img.shields.io/npm/v/@varshylinc/onboarding-consent-engine) | Terms/Privacy consent, GDPR/CCPA-style audit trail, signup consent block |
| [@varshylinc/mobile-payments](packages/mobile-payments) | ![npm](https://img.shields.io/npm/v/@varshylinc/mobile-payments) | RevenueCat IAP subscriptions, paywall UI, seat-aware write enforcement |
| [@varshylinc/team-management](packages/team-management) | ![npm](https://img.shields.io/npm/v/@varshylinc/team-management) | Org roster, roles, hierarchy, and admin People page |

Each package has its own README with install instructions, quick-start examples, and entry-point tables.

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
