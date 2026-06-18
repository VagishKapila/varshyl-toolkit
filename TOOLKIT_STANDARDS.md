# Varshyl Toolkit — Engineering Standards

> This document is the authoritative standard for all packages in `VagishKapila/varshyl-toolkit`.
> Introduced with `@varshylinc/onboarding-consent-engine` v0.1.0.

---

## Ephemeral Smoke CI Standard

**Every toolkit module ships with an ephemeral-CI Playwright smoke.**

### Rules (non-negotiable)

1. **Smoke runs on every PR push** against `demo-host` built from the PR branch inside the GitHub Actions runner.
2. **Smoke is the merge gate.** A red smoke blocks merge — no exceptions, no bypasses.
3. **No Railway dependency in CI smoke.** Railway is post-deploy verification only, never a merge gate.
4. **No "expected failure" smokes.** No advisory smokes. If smoke is red, fix it before merge.
5. **Smoke runs after `ci` passes** (`needs: ci`) — it is an additional gate, not a replacement.

### Why

Railway-hosted smoke can never be a pre-merge gate: it runs against the deployed version, which is the
code from the last *merged* commit. A PR's new code cannot be tested against Railway until *after* merge.
Running smoke against Railway in CI produces a permanently advisory job — a signal you always ignore.
An advisory merge gate is not a merge gate. It's noise that trains engineers to click "merge anyway."

### Implementation pattern

```yaml
smoke-<module>:
  name: smoke — <module-name>
  runs-on: ubuntu-latest
  needs: ci

  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: varshyl_smoke
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/varshyl_smoke
    PORT: 3001
    NODE_ENV: test
    TM_ENCRYPTION_KEY: test-encryption-key-for-ci-only!
    DEMO_HOST: http://localhost:3001

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20' }
    - uses: pnpm/action-setup@v3
      with: { version: 9.1.0 }
    - run: pnpm install --no-frozen-lockfile
    - run: pnpm --filter @varshylinc/team-management build
    - run: pnpm --filter @varshylinc/<module> build
    - run: pnpm --filter @varshylinc/demo-host build:server
    - run: node apps/demo-host/dist/server/index.js &
    - name: Wait for /healthz (max 60s)
      run: |
        for i in $(seq 1 30); do
          curl -sf http://localhost:3001/healthz && exit 0
          sleep 2
        done; exit 1
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm exec playwright test tests/smoke/<module>.spec.ts
      env:
        DEMO_HOST_URL: http://localhost:3001
```

### Smoke spec requirements

Each smoke spec **must** cover (at minimum):

| Scenario | Description |
|----------|-------------|
| S0 | `/healthz` returns 200 (confirms ephemeral server is fully booted) |
| S1 | Primary read endpoint returns expected data |
| S2 | Full write flow: submit → assert response |
| S3 | Assert DB row persisted (via read-back endpoint, not direct DB query) |
| S4 | Error path: invalid input → expected 4xx |

### /healthz contract

Every `apps/demo-host/server/index.ts` boot sequence must:
1. Complete all migrations (TM + each module)
2. Complete all seeds
3. Register all routes
4. Call `app.listen()` as the **last** step

`GET /healthz` must be registered **before** `app.listen()` and must return `{ status: 'ready' }` with
HTTP 200. Since `app.listen()` is the final boot step, a successful response means all migrations and
seeds have completed.

---

## Package Conventions

### SQL migrations

- Raw `pg.Pool` + SQL files — no ORM.
- Migration file naming: `NNNN_create_<prefix>_<table>.sql` (4-digit zero-padded prefix).
- Table prefix: each module owns a 2–5 character prefix (`tm_`, `oce_`, etc.) applied to ALL its tables.
- Ledger table: `<prefix>_schema_migrations` — identical structure across all modules.
- `runMigrations(pool)` must be idempotent (safe to call on every server restart).
- Build script **must** copy `src/server/migrations/*.sql` to `dist/server/migrations/`:
  ```
  "build": "tsc -p tsconfig.json && mkdir -p dist/server/migrations && cp src/server/migrations/*.sql dist/server/migrations/"
  ```

### TypeScript config

Each package ships two tsconfigs:
- `tsconfig.json` — NodeNext module resolution, compiles `src/server/**` + `src/shared/**` to `dist/`
- `tsconfig.client.json` — Bundler resolution, DOM lib, `jsx: react-jsx`, `noEmit: true`, for client components

### ESLint

Each package ships `.eslintrc.cjs` with `root: true`. Lint script: `eslint src --ext .ts,.tsx --max-warnings 0`.

### MODULE.md

Every package must ship `MODULE.md` documenting:
- Status header (RELEASED / IN PROGRESS / DEPRECATED)
- Public API table (exports + signatures)
- Owned tables
- Host requirements
- Adapter contract
- Version/tag plan
- Retroactive adoption guide (if applicable)

### `user_id` format

`user_id` is always stored as `TEXT` with no FK and no format constraint.
Each product stringifies its own PK before calling any module API:
- Integer PKs: `String(user.id)`
- UUID PKs: pass as-is

---

## Post-Deploy Verification (Railway)

After a PR merges and Railway redeploys, run the smoke spec manually against the live URL:

```bash
DEMO_HOST_URL=https://demo-host-production.up.railway.app \
  pnpm exec playwright test tests/smoke/<module>.spec.ts
```

This is NOT automated in CI. It is a manual post-deploy step.
Railway is never a CI dependency.

---

## Branch Protection

`main` requires all of the following status checks to pass before merge:
- `ci` — build, typecheck, lint, unit+integration tests, cross-import verification
- `smoke — onboarding-consent-engine` — ephemeral smoke for OCE module

Future modules add their own `smoke — <module>` check to this list on introduction.

Also recommended on `main`: `pre-publish-check` (packaging/tarball gate — add when prepush-rail PR lands).

---

## Pre-push rail (`pnpm prepush`)

Before pushing any module branch, run:

```bash
pnpm prepush -- @varshylinc/<package-name>
# With local Postgres integration tests required:
pnpm prepush -- @varshylinc/<package-name> --require-db
```

Implemented in `scripts/prepush-check.sh`. Encodes the manual Section-16 checklist and the publish bugs that cost multiple round-trips on the first two modules.

### Six recurring bug classes this prevents

| Bug class | Where it first bit us | What the rail checks |
|-----------|----------------------|----------------------|
| ESLint failures | auth-social initial PR | Step 2: `pnpm lint` |
| SQL migrations not in tarball | auth-social publish | Steps 7–8: `files` includes `migrations`; tarball lists `.sql` |
| `exports` map missing `require` | auth-social@0.1.0 publish | Step 6: every entry has `types` + `require` + `import` |
| Native SDK peer dep crashes non-Capacitor consumers | mobile-payments@0.1.0 `./client/revenuecat` | Step 8: tarball install **without** optional peers; all entry points load |
| Missing CHANGELOG at tag time | auth-social + mobile-payments release gate | Step 5: `## <version>` in CHANGELOG or pending changeset |
| Branch behind `main` at push time | mobile-payments land | Step 1: warn-only (never auto-rebase) |

### Changeset / CHANGELOG discipline

- Run `pnpm changeset` when cutting a release-worthy change.
- Run `pnpm changeset version` **before** pushing the release tag — this generates `CHANGELOG.md ## <version>` and bumps `package.json`.
- `release.yml` requires the `## <version>` section to **already exist** at publish time. The prepush rail hard-fails if neither a matching CHANGELOG section nor a pending changeset exists.

### Rebase policy

If the branch is behind `origin/main`, prepush prints a **warning only** — it never auto-rebases. Reconcile manually (`git rebase origin/main`), then re-run prepush.

### CI: `pre-publish-check`

Every PR also runs the **packaging-only** subset (steps 5–8) via the `pre-publish-check` CI job. Add `pre-publish-check` to `main` required checks when landing the prepush-rail PR (additive, same as smoke checks).

---

## Publishing — @varshylinc npm scope

### Scope and registry

All toolkit library packages publish to **npmjs.com** under the **`@varshylinc`** scope.

- npm org: `https://www.npmjs.com/org/varshylinc`
- Registry: `https://registry.npmjs.org/`
- Scope map in `.npmrc`: `@varshylinc:registry=https://registry.npmjs.org/`

### Which packages publish

| Package | Publishes | Reason |
|---------|-----------|--------|
| `@varshylinc/team-management` | ✅ Yes | Library — installable by products |
| `@varshylinc/onboarding-consent-engine` | ✅ Yes | Library — installable by products |
| `@varshylinc/demo-host` | ❌ No | `private: true` — verification harness only |
| root workspace | ❌ No | `private: true` — monorepo root |

Every publishable package **must** have in `package.json`:
```json
"publishConfig": {
  "access": "public",
  "registry": "https://registry.npmjs.org/"
}
```

### Publish trigger

Publishing runs automatically via `.github/workflows/release.yml` on every tag matching `*-vX.Y.Z` pushed to `main`:

1. `release` job: creates GitHub Release with CHANGELOG notes (unchanged)
2. `publish` job (gated on `release`): runs `pnpm publish -r --access public --no-git-checks`

`pnpm publish -r` automatically skips packages where `private: true`.

### NPM_TOKEN secret

The publish job requires a GitHub Actions secret `NPM_TOKEN`:

- Type: npm **Automation** token (not Classic)
- Scope: `@varshylinc` org on npmjs.com
- Location: repo Settings → Secrets → Actions → `NPM_TOKEN`
- Rotation deadline: Aug 30, 2027
- **Never commit the token value** — reference only as `${{ secrets.NPM_TOKEN }}`

### Installing toolkit packages in product repos

```bash
pnpm add @varshylinc/team-management
pnpm add @varshylinc/onboarding-consent-engine
```

No workspace configuration required in product repos.

---

## Secrets policy — mandatory for all modules

### Rule: secrets never in code

Secrets, credentials, tokens, and keys live in **environment variables** or the **Varshyl Vault** — never in source code, committed `.env` files, or published package contents.

Covers: API tokens · database URLs with credentials · private keys · OAuth secrets · JWT signing secrets · webhook secrets

### Secrets guard (mandatory CI job)

Every PR runs `gitleaks/gitleaks-action@v2` as required check `secrets-guard`:

- Scans full git history for secret patterns
- Fails build hard on any match — not advisory, not skippable
- Uses `GITHUB_TOKEN` (no GITLEAKS_LICENSE needed for public repos)

**Why non-negotiable:** Toolkit packages publish publicly to npm. Any secret committed to this repo appears in the npm tarball and git history, permanently.

### Checklist when adding a new publishable package

1. `"private": false` in `package.json`
2. `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }` in `package.json`
3. No secrets in `src/` — environment variables only
4. Build script copies all runtime assets to `dist/` (SQL files, etc.)
5. Add ephemeral smoke job to `ci.yml` (see Ephemeral Smoke section above)
6. `secrets-guard` covers the new module automatically

