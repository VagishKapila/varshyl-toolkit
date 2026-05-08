# Shared Module Architecture

**Status:** Locked May 8, 2026
**Decision authority:** Vagish Kapila
**Companion docs:** `DECISIONS.md` (Decision #N — Option 1), `BACKLOG.md` (Team Management v1), `MODULES.md` (module registry)
**Scope:** Cross-product code-sharing strategy for all Varshyl Inc. products (ConstructIInv, BrandOS, future).

> **Style B note:** This doc states the architecture as decided. Items marked `[NEEDS VERIFICATION]` are settled in principle but require a runtime/tooling check before the first module ships. They do not block the design.

---

## 0. Decision Recap (Why This Shape)

Vagish locked **Option 1 — single `varshyl-platform` monorepo, modules as versioned packages, products pin specific version tags.** Locked reasoning:

1. **One repo for Cowork to clone** — less workflow ceremony, one CLAUDE.md, one BRAIN.md scoped to the toolbox.
2. **One PR can update modules that work together** — when Team Management and User Audit Log need a coordinated change, it's one diff, one CI run.
3. **Version pinning protects products from breaking changes** — ConstructIInv can stay on `team-management@1.2.x` while BrandOS moves to `2.0.0` on its own schedule.
4. **Products upgrade on their own schedule** — no synchronized release train, no "everybody update at once."
5. **Inline modules stay inline until earned in** — Trust Score and Vendor Invites are NOT moving today. Team Management is the toolbox's first occupant. Extraction is a later, separate decision per module.

What this is NOT:
- Not a microservices play. Modules are libraries that ship as code, not services.
- Not a forced unification. Products keep their own repos, deploys, databases, and release cadences.
- Not retroactive. Already-inline ConstructIInv code is not being touched.

---

## 1. Repo Structure

### 1.1 Top-level tree

```
varshyl-platform/                           ← new repo, GitHub: varshyl-inc/varshyl-platform
├── packages/
│   ├── team-management/                    ← FIRST occupant (May 2026)
│   │   ├── src/
│   │   │   ├── server/
│   │   │   │   ├── routes/                 ← Express routers
│   │   │   │   ├── services/               ← Business logic
│   │   │   │   ├── sql/                    ← Parameterized queries
│   │   │   │   ├── migrations/             ← Ordered SQL files (NNNN_description.sql)
│   │   │   │   └── index.ts                ← createServerModule({ adapter, db, ... })
│   │   │   ├── client/
│   │   │   │   ├── components/             ← React components, Tailwind + shadcn/ui
│   │   │   │   ├── pages/                  ← Top-level page components
│   │   │   │   ├── hooks/
│   │   │   │   ├── api.ts                  ← Typed fetch wrappers
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts                ← Public exports only
│   │   │   ├── shared/
│   │   │   │   └── types.ts                ← Types used by both server and client
│   │   │   └── index.ts                    ← Barrel: re-exports server + client + shared
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/                ← Runs against ephemeral Postgres
│   │   │   └── fixtures/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── CHANGELOG.md                    ← Keep-a-Changelog format, mandatory
│   │   └── README.md                       ← Adapter contract + install + usage
│   │
│   ├── trust-score/                        ← FUTURE — extracted from ConstructIInv when earned in
│   ├── vendor-invites/                     ← FUTURE — extracted when earned in
│   └── aria-core/                          ← FUTURE
│
├── scripts/
│   ├── new-module.sh                       ← Scaffolds a new package from template
│   ├── tag-release.sh                      ← Creates `<module>-v<X.Y.Z>` git tag
│   └── verify-no-cross-imports.sh          ← CI guard: packages/* may not import each other
│
├── .changeset/                             ← Changesets for per-package semver
├── .github/
│   └── workflows/
│       ├── ci.yml                          ← Per-package: typecheck, test, build
│       ├── release.yml                     ← Triggered by changeset PR merge
│       └── verify-isolation.yml            ← Runs verify-no-cross-imports.sh
│
├── package.json                            ← Workspace root
├── pnpm-workspace.yaml                     ← packages/* glob   [NEEDS VERIFICATION: confirm pnpm vs npm workspaces]
├── tsconfig.base.json
├── CLAUDE.md                               ← Cowork session startup
├── BRAIN.md                                ← Toolbox-level decisions and lessons
├── README.md
└── LICENSE
```

### 1.2 What lives at the root vs. inside a package

| Lives at root | Lives in `packages/<module>/` |
|---|---|
| Workspace tooling (pnpm config, Changesets) | All source code, server + client + migrations |
| Shared `tsconfig.base.json` only | Module-specific `tsconfig.json` extending base |
| CI workflows | Per-module tests, fixtures, README, CHANGELOG |
| Cross-cutting scripts | Module's own scripts if any |
| `CLAUDE.md` for Cowork session orientation | Nothing Cowork-specific per module |

### 1.3 Hard rule: no cross-package imports

`packages/team-management/` may not import from `packages/trust-score/`. Enforced by:
- TypeScript `paths` config that doesn't expose sibling packages.
- CI step (`verify-no-cross-imports.sh`) that greps for `from '@varshyl/<other>'` inside each package and fails the build.
- ESLint rule (when added) banning the same.

If two modules genuinely need to share code, that shared code becomes its own package (e.g., `@varshyl/auth-primitives`). No exceptions, no "just this once" cross-imports.

---

## 2. Standard Module Interface Contract

Every package in `packages/` must export the same shape. This is what makes the toolbox a toolbox.

### 2.1 Required exports from `src/index.ts`

```typescript
// Server side
export { createServerModule } from './server';
export type { ServerModuleAdapter, ServerModuleConfig } from './server/types';

// Client side
export { ClientModuleProvider } from './client';
export * as Pages from './client/pages';
export * as Components from './client/components';
export type { ClientModuleConfig } from './client/types';

// Shared types — public API surface
export type * from './shared/types';
```

### 2.2 The adapter pattern (the contract)

A module never reaches into product-specific tables directly. Product provides an **adapter** at boot. The module calls the adapter; the adapter does the product-specific lookup.

```typescript
// packages/team-management/src/server/types.ts
export interface ServerModuleAdapter {
  // Identity — module never SELECTs from product's users table
  getCurrentUserId(req: Request): Promise<number | null>;
  getOrganizationIdForUser(userId: number): Promise<number | null>;

  // Authorization — product decides what "admin" means in its context
  isUserOrgAdmin(userId: number, orgId: number): Promise<boolean>;

  // Notifications — product provides its own delivery mechanism
  sendInviteEmail(args: { to: string; token: string; orgName: string }): Promise<void>;
  emitNotification(args: { userId: number; type: string; payload: object }): Promise<void>;

  // Logging — product owns observability stack (Sentry, BetterStack, pino)
  logger: { info: (...a: unknown[]) => void; warn: (...a: unknown[]) => void; error: (...a: unknown[]) => void };
}
```

The product writes ONE adapter per module, in product-side code, when it installs the module. The adapter is the only place product internals leak in.

### 2.3 Server module shape

```typescript
import express from 'express';
import { createServerModule } from '@varshyl/team-management';

const teamMgmt = createServerModule({
  adapter,                    // ServerModuleAdapter
  db,                         // pg Pool — module owns its own tables only
  config: {
    inviteExpiryDays: 7,
    encryptionKey: process.env.TEAM_MGMT_ENCRYPTION_KEY!,
  },
});

await teamMgmt.runMigrations();          // Idempotent — see §3
app.use('/api/team', teamMgmt.router);   // Mount under product-chosen prefix
app.get('/api/team/health', teamMgmt.health);
```

### 2.4 Client module shape

```tsx
import { ClientModuleProvider, Pages } from '@varshyl/team-management/client';

<ClientModuleProvider apiBaseUrl="/api/team" authToken={jwt}>
  <Routes>
    <Route path="/team" element={<Pages.TeamRosterPage />} />
    <Route path="/team/invites" element={<Pages.InvitesPage />} />
    <Route path="/team/audit" element={<Pages.AuditLogPage />} />
  </Routes>
</ClientModuleProvider>
```

The product wires the routes into its own `App.tsx`. The module provides pages and components but does not own the router — the product does.

### 2.5 Mandatory README sections per module

Every `packages/<module>/README.md` must contain, in this order:

1. **What this module does** — one paragraph.
2. **Adapter contract** — exact TypeScript interface the host product must implement.
3. **Install** — pinning instructions (see §4).
4. **Migration call** — how and when to call `runMigrations()`.
5. **Routes mounted** — every endpoint the server router exposes.
6. **Pages exported** — every top-level page the client exports.
7. **Environment variables** — every env var the module reads.
8. **Owned tables** — every DB table this module creates and writes to.
9. **Events emitted** — every notification or hook the module fires.
10. **Breaking change history** — link to CHANGELOG.

If a section is missing, the module is not ready to be installed.

---

## 3. Database + Migrations Strategy

This is the section that breaks most monorepo-of-modules attempts. Get this wrong and the modules become un-extractable.

### 3.1 Each module owns its tables. Period.

| Rule | Why |
|---|---|
| Tables get a module-specific prefix: `tm_` for team-management, `ts_` for trust-score, `vi_` for vendor-invites. | Trivial visual ownership in any DB browser. Prevents collisions across modules. |
| Migrations live in `packages/<module>/src/server/migrations/`. | Migration travels with the code that depends on it. |
| Migrations are numbered + named: `0001_create_tm_organizations.sql`, `0002_add_tm_audit_log.sql`. | Ordered, append-only, never edited after merge. |
| All migrations are **idempotent** — `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. | Safe to re-run. Safe to deploy multiple times. Matches existing ConstructIInv `db.js` pattern. |
| Module never `ALTER`s a table it doesn't own. | Hard rule. If a module needs a column on `users`, it asks the adapter; it does not migrate the product's table. |
| Foreign keys cross ONE direction only: product tables may FK into module tables, never the reverse. | Module stays portable. Removing a module from a product is a `DROP TABLE` not a graph-rewrite. |

### 3.2 Migration runner contract

Each module exports `runMigrations(db)`:

```typescript
async function runMigrations(db: Pool): Promise<{ applied: string[]; skipped: string[] }> {
  // 1. Ensure tm_schema_migrations table exists (per-module migration ledger)
  // 2. List all migration files in src/server/migrations/, sorted by filename
  // 3. For each: skip if already applied (filename in ledger), else apply in transaction
  // 4. Return what was applied and what was skipped
}
```

Per-module ledger table: `tm_schema_migrations`, `ts_schema_migrations`, etc. Modules never share a migration ledger — each is independent and self-tracking.

### 3.3 Where the product calls it

Product calls `await teamMgmt.runMigrations()` at server boot, AFTER the product's own migrations and BEFORE accepting traffic. Order is fixed:

1. Product's own DB migrations (existing pattern, e.g., ConstructIInv's `db.js`).
2. Each installed module's `runMigrations()` in declaration order.
3. Mount routers, start listening.

If any module's migrations fail, the server fails to boot. No partial state.

### 3.4 Cross-module data joins (handled in product, not in module)

Trust Score wants a vendor's organization name from Team Management. The Trust Score module does NOT join `ts_vendor_scores` to `tm_organizations`. Instead:

- Trust Score returns vendor IDs.
- Product code receives the IDs, calls Team Management's adapter to enrich with org names.
- Product code returns the joined view to the client.

This keeps modules independently extractable. If Trust Score needed `JOIN tm_organizations`, the two would be welded together forever.

---

## 4. Version Pinning + Tag Conventions

### 4.1 Per-package semver

Each package versions independently. Changesets manages it.

- **Patch** (`1.2.3 → 1.2.4`) — bug fix, no API change, no migration.
- **Minor** (`1.2.3 → 1.3.0`) — new feature, additive only. New routes okay; new optional adapter methods okay. New migrations okay if backward-compatible.
- **Major** (`1.2.3 → 2.0.0`) — breaking change. Removed routes, changed adapter signatures, destructive migrations, schema rewrites.

### 4.2 Git tag convention

Format: `<package-name>-v<X.Y.Z>`.

Examples:
- `team-management-v1.0.0`
- `team-management-v1.0.1`
- `trust-score-v0.3.0`

Tags are immutable. Once pushed, never deleted, never moved. CI enforces tag uniqueness.

### 4.3 How products install

Two delivery channels supported. Pick one per organization, not per module.

**Option A — Git tag pin (simplest, recommended for now):**

```json
// In ConstructIInv's package.json
{
  "dependencies": {
    "@varshyl/team-management": "github:varshyl-inc/varshyl-platform#team-management-v1.0.0"
  }
}
```

`npm install` clones the monorepo at that tag and uses the package subdirectory. No registry needed. Works today.

**Option B — GitHub Packages (later, when there are 3+ modules):**

```json
{
  "dependencies": {
    "@varshyl/team-management": "1.0.0"
  }
}
```

With `.npmrc` configured for `@varshyl` scope on GitHub Packages. Requires a publish step in CI. Cleaner installs, faster `npm install`, real version resolution. [NEEDS VERIFICATION: confirm GitHub org allows package publishing on current plan.]

**Default for Phase 1:** Option A. We migrate to Option B when the third module ships.

### 4.4 What pinning protects

- ConstructIInv pins `team-management-v1.2.0`. Toolbox releases `1.3.0`. ConstructIInv keeps running on `1.2.0` indefinitely.
- BrandOS independently moves to `1.3.0` whenever its team is ready.
- A breaking change in `2.0.0` does not touch any pinned product until that product opts in.

### 4.5 Mandatory CHANGELOG

Every package has `CHANGELOG.md` in Keep-a-Changelog format. Every release tag corresponds to a CHANGELOG entry. Major bumps include a "Migration steps" subsection. CI fails the release if the CHANGELOG was not updated in the same PR as the version bump.

---

## 5. Cowork Workflow — Three Scenarios

These are the three scenarios that actually happen. Everything else is a variation.

### 5.1 Scenario A — Build a new module (Team Management, today)

```
1. Cowork session opens varshyl-platform repo.
2. CLAUDE.md is read. BRAIN.md is read.
3. Run `pnpm new-module team-management` (or manual: copy from a template package).
4. Build server: routes, services, sql, migrations.
5. Build client: pages, components, api, types.
6. Run `pnpm --filter @varshyl/team-management test` — all green.
7. Run `pnpm --filter @varshyl/team-management build` — TypeScript clean, build artifact produced.
8. Open changeset: `pnpm changeset` — minor or major as appropriate.
9. Commit, push, open PR.
10. CI runs: typecheck, test, build, isolation check.
11. Merge PR. Release workflow runs: bumps version, updates CHANGELOG, pushes tag `team-management-v0.1.0`.
12. Switch to ConstructIInv repo (separate Cowork session, NEW chat — toolbox and product work do not share context).
13. In ConstructIInv: write the adapter. Add `@varshyl/team-management` pinned to `team-management-v0.1.0`.
14. Wire `runMigrations()` into server boot. Mount router. Add routes to client App.tsx.
15. Run product's full QA suite (existing 7-layer for ConstructIInv). All green.
16. Layer 9 verification: real headless browser screenshots of Team Management flows in ConstructIInv UI.
17. Ship.
```

Key rule: **toolbox work and product integration are separate Cowork sessions.** Mixing them is how context contamination happens.

### 5.2 Scenario B — Bug in a module used by 2 products

Setup: ConstructIInv and BrandOS both use `team-management-v1.2.0`. Bug found in invite token expiry.

```
1. Cowork opens varshyl-platform.
2. Reproduce the bug in a module-level integration test (failing test first — TDD).
3. Fix the code. Test goes green.
4. Patch bump: 1.2.0 → 1.2.1. Changeset entry describes the fix.
5. PR, CI, merge, tag `team-management-v1.2.1`.
6. Update CHANGELOG.

Each product owner now decides independently when to bump:
  - ConstructIInv: bump pin to v1.2.1, deploy, verify. Maybe today, maybe Friday.
  - BrandOS: bump pin to v1.2.1 on its own schedule.

Both products stayed on v1.2.0 until they pulled the fix. No forced synchronization.
```

**Hot-fix path** (when "schedule" is "now"): Vagish or another admin directly bumps both products' pins in same-day PRs. The toolbox release process is unchanged — only the product-side urgency differs.

### 5.3 Scenario C — Breaking change migration

Setup: Team Management needs to add fine-grained permissions. The `isUserOrgAdmin(userId, orgId)` adapter signature has to change to `getUserPermissions(userId, orgId): Permission[]`. This breaks every existing host adapter.

```
1. In varshyl-platform, design the new API.
2. Land it as a major bump: 1.x.x → 2.0.0.
3. CHANGELOG entry includes a "Migration steps" subsection:
     - Old adapter method removed.
     - New adapter method required.
     - Example old → new adapter code.
     - DB migrations included in 2.0.0 are listed and characterized (additive vs. destructive).
4. v1.x.x stays usable. Tag `team-management-v1.99.x` may be used to back-port critical fixes.
5. Each product schedules its own migration:
     a. Pick a sprint.
     b. Update product's adapter to satisfy the new interface.
     c. Bump pin to v2.0.0.
     d. Run module's runMigrations() — migrations are idempotent and forward-only.
     e. Test, ship.
6. Once all products are on v2.x, mark v1.x deprecated in CHANGELOG. Stop back-porting after a documented sunset date.
```

**No product is forced to migrate on the toolbox's timeline.** The dual-version coexistence window can be days or months.

**No destructive migration ever runs without an explicit major bump.** A patch or minor that drops a column is a CI failure.

---

## 6. Phased Rollout

The toolbox earns its keep one module at a time. Speculative extraction is forbidden.

### 6.1 Phase 1 — Team Management is born here (May 2026)

**Goal:** First occupant. Proves the architecture works under real conditions.

- Team Management is built directly in `varshyl-platform` from day one. It is never inline in a product first.
- ConstructIInv is the first consumer. BrandOS is the second consumer (target: within 60 days of v1.0.0).
- Trust Score, Vendor Invites, ARIA, Lien Module — all stay inline in ConstructIInv. **No extraction in Phase 1.**

**Phase 1 success criteria, all four required:**
1. `team-management-v1.0.0` is published.
2. ConstructIInv installs and ships it to production. Real customers use it.
3. BrandOS installs and ships it. Real customers use it.
4. At least one bug-fix patch release flows cleanly through both products.

When all four are met, Phase 1 is done.

### 6.2 Phase 2 — Earn-in evaluation (≥ 30 days after Phase 1 success)

**Goal:** Decide which inline module, if any, is "earned in" enough to extract.

For each inline module, ask:

| Earn-in criterion | What it means |
|---|---|
| Used (or imminently needed) by 2+ products | If only ConstructIInv uses it, extracting now creates overhead with no payoff. |
| Stable for 30+ days inline with no major API churn | If the public surface is still moving, extracting now means immediate breaking changes. |
| Public API is already clean — no leaking internals | If product internals show through, the adapter shape isn't designed yet. |
| Tests cover the public surface | Extraction without tests is faith, not engineering. |
| Database tables already use a clean prefix or can be safely renamed | If tables are named `vendors`, `vendor_trust_scores`, etc., a `ts_*` rename migration must be planned in. |

Anti-criteria — do NOT extract if any of these is true:

- Module is less than 30 days old in production.
- Module is currently being actively reshaped.
- Module has heavy coupling to product-specific tables that can't be replaced by adapter calls.
- No second product has a concrete near-term use for it.

**Likely Phase 2 candidates (speculative, requires evaluation when the time comes):**
- Vendor Invites — could plug into BrandOS for client-onboarding flows.
- Trust Score — generic enough that a second product could reuse with a different signal set.

**Definitely NOT Phase 2:**
- Lien Module — California-specific, deeply ConstructIInv-specific. Stays inline.
- ARIA chat — too entwined with ConstructIInv's domain prompts. Possibly never extracted.

### 6.3 Phase 3 — Extract one module at a time

Each extraction is its own dedicated work stream. Never bundle two extractions in one Cowork session.

**Per-extraction protocol:**

1. New design doc: `MODULE_EXTRACTION_<name>.md`. Lists current call sites, public API to preserve, table renames if any, adapter shape.
2. Build the package in `varshyl-platform` from scratch, copying logic from product but rewriting against the adapter interface.
3. Tests in toolbox repo cover the new package.
4. Tag `<name>-v0.1.0` (or `v1.0.0` if confident).
5. In product: install pinned version. Run a parallel cutover — old inline code stays mounted, new module mounts under a feature flag.
6. Cut traffic over via flag. Monitor.
7. Once stable for ≥ 7 days, delete inline code in a cleanup PR.

**No big-bang extractions.** Parallel cutover is mandatory.

### 6.4 Phase 4 (long horizon) — toolbox as default

**Goal:** Eventually, anything genuinely cross-cutting is born in `varshyl-platform`. Product repos focus on product-specific code.

This is not a target with a date. It's the natural endpoint if Phases 1–3 succeed. If they don't, we revise the architecture before forcing more modules into it.

---

## Appendix A — Summary Cheatsheet

| Question | Answer |
|---|---|
| Where do modules live? | `varshyl-platform/packages/<module>/` |
| How do products consume them? | Pinned git tag in `package.json`, e.g., `github:varshyl-inc/varshyl-platform#team-management-v1.0.0` |
| Can modules import each other? | No. CI fails the build if they do. |
| Where do migrations live? | Inside the module package. Module owns its own ledger table. |
| Who runs migrations? | Product calls `await module.runMigrations()` at server boot. |
| How does a module reach product data? | Through the adapter interface only. Never direct SQL into product tables. |
| What's the first module? | Team Management. Born directly in toolbox. May 2026. |
| When does Trust Score move to the toolbox? | When earned in. Not before. Phase 2 evaluation, no earlier than 30 days after Phase 1 success. |
| How does a product upgrade a module? | Bumps the pin in its `package.json`, on its own schedule. |
| What if two modules need shared code? | A new shared package. Never cross-imports. |

---

## Appendix B — Open Items Before First Module Ships

These do not block the architecture decision but must be settled before `team-management-v0.1.0` is tagged.

1. **Workspace tool:** pnpm vs. npm workspaces vs. yarn workspaces. `[NEEDS VERIFICATION]` — recommend pnpm for monorepo speed; confirm Cowork environment supports it.
2. **Changesets vs. manual release:** Changesets recommended; confirm fits Cowork automation patterns documented in `OPS_RULES.md`.
3. **GitHub Packages eligibility:** check whether varshyl-inc org plan supports private package publishing if/when Phase 1 transitions to Option B distribution. `[NEEDS VERIFICATION]`
4. **Encryption key management for module-owned secrets:** Team Management will need an invite-token encryption key, similar to ConstructIInv's `VENDOR_INVITE_ENCRYPTION_KEY`. Decide whether each product sets its own per-module key or whether a shared Varshyl secrets manager is introduced.
5. **CI runtime:** GitHub Actions assumed. Confirm cost / minute budget for a multi-package monorepo with parallel jobs.

These five items become the agenda of the first toolbox setup session, separate from any module-build session.

---

*Authored in Construct14 — Bible & Research chat, May 8, 2026. Routes into `BIBLE_v5.md` Section [TBD — Cross-Product Architecture]. Companion entries land in `DECISIONS.md` (Option 1 lock), `BACKLOG.md` (Phase 2 evaluation trigger), and `MODULES.md` (registry seeded with Team Management).*
