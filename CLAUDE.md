# varshyl-toolkit — Cowork Session Guide

## Read this first, every session

1. Read this file
2. Read `docs/SHARED_MODULE_ARCHITECTURE.md` — architecture decisions are locked
3. Identify which package you are working on (`packages/<name>` or `apps/demo-host`)
4. Pick one of the 3 scenarios below and follow it

## Repository layout

```
varshyl-toolkit/
├── packages/              # Shared modules — one per product feature domain
│   └── team-management/   # Stub; fleshes out in Team Management design chat
├── apps/
│   └── demo-host/         # Verification harness (NOT a product)
├── docs/
│   └── SHARED_MODULE_ARCHITECTURE.md
├── scripts/
│   ├── new-module.sh      # Scaffold a new package
│   ├── tag-release.sh     # Cut a release tag
│   └── verify-no-cross-imports.sh
└── .github/workflows/
    ├── ci.yml             # Runs on every PR: typecheck, lint, test, build, isolation
    └── release.yml        # Runs on tag push: creates GitHub Release
```

## The 3 session scenarios

### Scenario 1 — New module

```bash
bash scripts/new-module.sh <module-name>
pnpm install
pnpm typecheck
```

Then:
- Define `ServerModuleAdapter` interface in `packages/<name>/src/server/types.ts`
- Write first migration SQL in `packages/<name>/src/server/migrations/0001_*.sql`
- Add migration to the `MIGRATIONS` array in `packages/<name>/src/server/index.ts`
- Write integration test in `packages/<name>/tests/integration/migrations.test.ts`
- Run `pnpm verify` — must be green before committing

### Scenario 2 — Bug fix

```bash
pnpm typecheck        # confirm scope of breakage first
pnpm test             # identify failing test (or write one if none exists)
# fix root cause
pnpm verify           # must pass before committing
```

Commit format: `fix(<package-name>): <description>`

### Scenario 3 — Breaking change / new feature

```bash
# 1. Make the change
# 2. Update CHANGELOG.md with the new version section
# 3. Bump version in package.json
pnpm verify
bash scripts/tag-release.sh <package-name> <X.Y.Z>
git push origin <package-name>-v<X.Y.Z>
```

## Verify command (run before every commit)

```bash
pnpm verify
# Runs: typecheck → test → build → cross-import check
```

## Rules that never bend

- Modules NEVER import each other (CI enforces this via `verify-no-cross-imports.sh`)
- All DB tables prefixed: `tm_*` for team-management, new modules get their own prefix
- `runMigrations()` is always idempotent — safe to call on every boot
- Host products NEVER query module tables directly — only through the module's API
- No secrets in code — always `process.env.*`
- `apps/demo-host` is a harness, not a product — keep it minimal

## Stack

- **Runtime:** Node 20, TypeScript 5, pnpm 9 workspaces
- **Server:** Express 4
- **DB:** PostgreSQL 16 (via `pg` Pool)
- **Client:** React 18, Vite 5, Tailwind CSS 3
- **Tests:** Vitest (unit + integration with real Postgres)
- **CI:** GitHub Actions

## Key contacts & resources

- Architecture doc: `docs/SHARED_MODULE_ARCHITECTURE.md`
- Full architecture source: Construct14 — Bible & Research chat (Cowork)
- Railway dashboard: https://railway.app/project/dfc9a5aa-b63b-4275-93d8-55173eb1eda5 (demo-host deployment)
- Demo host URL: https://demo-host-production.up.railway.app
- Repo: https://github.com/VagishKapila/varshyl-toolkit
