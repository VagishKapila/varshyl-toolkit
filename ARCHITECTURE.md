# Architecture

Engineering design of the Varshyl Toolkit monorepo. This document is public — it describes how the packages are built and released, not product strategy or deployment details.

## Design philosophy

The toolkit is a set of **independently versioned libraries**, not a framework or a hosted service. Each package:

- Owns its Postgres tables under a unique prefix (`as_`, `oce_`, `mp_`, `tm_`).
- Exposes a **server module** (Express router + migration runner) and a **client module** (React components + hooks).
- Never queries the host product's tables directly — only through an **adapter interface** the host implements at integration time.
- Never imports sibling packages — enforced by CI (`verify-no-cross-imports.sh`).

Host products wire routes, call `runMigrations()` at boot, and mount module routers under a prefix they choose.

## Adapter boundaries

The adapter is the only seam between a module and the host app.

| Concern | Owner |
|---|---|
| User records, org membership lookups, admin checks | Host (via adapter) |
| Module-specific tables, sessions, consent records, subscriptions | Module |
| Email delivery, analytics hooks | Host (via adapter callbacks) |
| Route prefixes, JWT/session middleware | Host |

Example: `@varshylinc/auth-social` stores credentials and sessions in `as_*` tables but calls `AuthUserAdapter.findUserByEmail()` when it needs the canonical user row. `@varshylinc/team-management` calls `ServerModuleAdapter.isUserOrgAdmin()` instead of reading a product `users` table.

## Service interface + mock pattern

Every server module exports:

1. A **real implementation** backed by Postgres (`createAuthService`, `createSubscriptionStore`, `createConsentModule`, `createServerModule`).
2. A **mock implementation** for tests and CI smoke (`createMockAuthService`, `createMockSubscriptionStore`, etc.).

CI smoke tests (`tests/smoke/*.spec.ts`) boot a minimal Express app with mocks — no real OAuth keys, RevenueCat secrets, or mail delivery. This keeps the publish gate fast and deterministic while native flows are verified on-device separately.

## Optional-peer lazy-import pattern

Native SDKs (`@capgo/capacitor-social-login`, `@revenuecat/purchases-capacitor`) are **optional peer dependencies**. They live in separate export paths:

- `@varshylinc/auth-social/client/capgo`
- `@varshylinc/mobile-payments/client/revenuecat`

Web builds and CI never import these paths. Device builds install the peer and pass the provider to `configureAuth()` or `configureSubscriptions()`. This avoids bundler failures when the native module is absent.

## Database + migrations

- Raw SQL files, numbered `0001_description.sql`, shipped inside each package's `dist/`.
- `runMigrations(pool)` is **idempotent** — uses `CREATE TABLE IF NOT EXISTS` and a per-module ledger table (`as_schema_migrations`, `oce_schema_migrations`, etc.).
- Host calls migrations at server boot, after its own migrations and before accepting traffic.
- Modules never `ALTER` tables they do not own.

## Release flow

1. Developer opens a PR with code changes + a Changesets entry (`pnpm changeset`).
2. CI runs typecheck, lint, test, build, cross-import check, and smoke tests.
3. On merge, maintainer runs `pnpm changeset version` to bump versions and update per-package `CHANGELOG.md`.
4. Git tags follow `<package-name>-v<X.Y.Z>` (e.g. `auth-social-v0.2.1`).
5. Tag push triggers `release.yml` — GitHub Release + npm publish.

Products pin specific versions and upgrade on their own schedule.

## Pre-push rail

`pnpm prepush -- @varshylinc/<package>` is the local publish gate. It catches six bug classes that slipped through before the rail existed:

1. **Stale branch** — warns if behind `origin/main`.
2. **Lint failures** — ESLint across the workspace.
3. **Broken tests / skipped DB tests** — package Vitest suite (integration tests need `DATABASE_URL`; CI provides Postgres).
4. **Demo-host build breakage** — proves the harness still compiles against the package.
5. **Missing CHANGELOG / changeset** — release cannot proceed without a version entry.
6. **Broken exports map or tarball** — validates `types` + `require` + `import` conditions, `files` array, and runs `pnpm pack` + `npm install` smoke on the tarball (catches missing `dist/` files, empty exports, absent migrations).

## Repo layout

```
varshyl-toolkit/
├── packages/           # Published modules (one directory per package)
├── apps/demo-host/     # Internal verification harness (not published)
├── tests/smoke/        # Cross-package smoke specs
├── scripts/            # new-module.sh, tag-release.sh, prepush-check.sh
└── .changeset/         # Changesets config
```

## Adding a module

```bash
bash scripts/new-module.sh <module-name>
```

Scaffolds server/client/migrations from the team-management template. New modules get their own table prefix and must pass the same prepush gate before first publish.

## What this doc deliberately omits

Deployment URLs, cloud project IDs, API keys, seed credentials, product roadmaps, and host-app-specific business logic. Those belong in private runbooks, not in a public repository.
