# DECISIONS.md

> **Role in the doc set:** Locked architectural decisions for ConstructIInv AI and the `varshyl-toolkit` platform. Each entry is an ADR (Architectural Decision Record) with rationale and a one-line summary. **Once a decision is in this file, it is not re-debated** unless a fresh, named, dated reason is added to the Reopen log at the bottom.
>
> **Source.** Compiled from past chats April 11 – May 8, 2026. Reconciled against Bible v4, vendor-sub-portal design doc v3, the live `BRAIN.md` committed at `f464e02`, and today's `varshyl-toolkit` bootstrap (commits through May 8 v0.0.1 release).
>
> **How to use this file.** Build agents and future Cowork sessions read this BEFORE starting any work that might touch architecture. The one-line summary at the bottom of each ADR is what new agents scan first. Cross-references to `LESSONS.md`, `OPS_RULES.md`, `MODULES.md`, and `SHARED_MODULE_ARCHITECTURE.md` appear inline.

---

## ADR-1 · Frontend rebuild only, backend stays

**Decision.** v3 of ConstructIInv is a frontend rebuild. Backend stays as-is, with bug fixes and the cataloged wirings (vendor-book, repository, reporting, etc.) connected.

**Rationale.**
- Backend works. G702 math, Stripe webhooks, Hub routes, ARIA lien generation, SOV parsing — all live and tested in production.
- 30 async-handler vulnerabilities were patched May 6, 2026 (`7f9aae54`) — backend is now structurally sound.
- The product's UX problem is in the frontend. Information architecture, navigation, command center layout — these are the gaps.
- ~2,019 lines of fully-built feature code (`vendor-book/`, `repository/`, `reporting/HubReports`, `early-pay/`, `stripe-onboard/`) sit unmounted on production. v3 wires them.

**Implication.** Do not rewrite `server/features/*`. Wire it in v3.

**One-line.** v3 = new frontend over existing backend.

---

## ADR-2 · 4-stage pipeline as ProjectDetail centerpiece (no tabs)

**Decision.** The ProjectDetail page is anchored by a horizontal 4-stage pipeline (left-to-right, with status icons): **SOV & Invoice → Lien Documents → Vendors & Trades → ARIA Intelligence**.

**Rationale.**
- Maps to how money flows in construction: bill the work → secure the rights → pay the people → know what's coming.
- Replaces the "5 disconnected tabs" problem in current ProjectDetail.
- Each node has three lines of metadata: title, sub-detail, status (✓ complete / ⚠ action needed / blank not started / ✨ ARIA-ready).
- Each node, when clicked, expands a workspace below (orbital for Vendors, document grid for Lien, pay app workspace for SOV & Invoice).

**Layout below the pipeline.** ARIA bar (always visible, teal callout, contextual message + "Take Action →" CTA) → 2x2 action card grid for guided next-actions.

**Implication.** ProjectDetail.tsx = `<Pipeline />` + `<AriaBar />` + `<ActionGrid />` + `<WorkspaceForActiveStage />`. No tabs.

**One-line.** ProjectDetail = pipeline + ARIA bar + action grid, no tabs.

---

## ADR-3 · Color tokens: vendor teal, contractor blue, orbital dark

**Decision.** Vendor surfaces are **teal `#0F766E`**. Contractor surfaces are **blue `#2563eb`**. Orbital canvas is **dark `#020817`** (non-negotiable).

**Rationale.**
- Construct 9 (May 1, 2026) shipped vendor portal in teal. Bible v4 still said orange `#ea6c00` — Bible was stale on this point. **Teal supersedes.**
- Teal reads as institutional and partner-coded; orange reads as warning. Vendors are partners, not problems.
- Blue for contractor preserves all current contractor surfaces — no migration cost.
- Orbital must stay dark — solar system metaphor. Light backgrounds destroy it.
- Dollar amounts always JetBrains Mono, `formatMoney()`, 2 decimals, comma-separated.

**Implication.** All vendor screens use `--teal-700: #0F766E` as primary accent. Hero card gradients teal-50 → teal-100. Contractor stays blue. Orbital stays `#020817` (or `#04070f` depending on which token is in shipping code; treat them as equivalent for this decision).

**One-line.** Vendor = teal `#0F766E`, contractor = blue `#2563eb`, orbital = dark `#020817`.

---

## ADR-4 · Mobile-first, single design system, 44px touch targets

**Decision.** All new components are designed for mobile (<768px) first, then expanded to desktop. One design system. 44px minimum touch target on any tappable element.

**Rationale.** Field personnel (the core sub user) are on mobile by default. The desktop experience generalizes from mobile cleanly; the reverse rarely works. Bible §2.3 already commits to purpose-built mobile components.

**Implication.** No "mobile in scope as v2" thinking. Every component lands mobile-functional on day one.

**One-line.** Mobile-first, one design system, 44px touch targets.

---

## ADR-5 · Sidebar IA: 7 contractor surfaces, 3 vendor surfaces, Lien promoted top-level

**Decision.** Contractor sidebar has 7 surfaces. Vendor sidebar has 3. **Lien is a top-level contractor sidebar item** (not buried under Reports), reflecting that lien deadlines drive cash flow protection.

**Contractor sidebar (7).**
1. Projects (default home)
2. Cash Flow (cross-project)
3. Lien (cross-project lien dashboard)
4. Payments
5. Reports
6. Settings
7. Help

**Vendor sidebar (3).** Active Projects · Archived · Invitations.

**Rationale.** A previous proposal made it 6 with Lien only contextual inside ProjectDetail. The current ADR is 7 with Lien promoted because lien windows are time-sensitive and cross-project — contractors need a portfolio view. Inside ProjectDetail, Lien is also Step 2 of the pipeline (ADR-2). Both views share one backend (ADR-9).

**One-line.** Contractor 7 surfaces, Vendor 3, Lien promoted top-level.

---

## ADR-6 · Branch model: build new modules off `main`, not `staging`

**Decision.** Until the `staging` branch is reconciled, all new modules build off `main` with atomic PRs. No new feature branches start from `staging`.

**Rationale.**
- `staging` and `main` had no shared commit history (orphan branches) as of early May 2026.
- `staging` could not build on its own (Dashboard.tsx had the rewrite that fixed TS errors but main didn't until the May 5/6 promote).
- Bug D and PDF fixes shipped clean by going straight to `main` with the Git Data API. Atomic PRs work better than merge ceremonies for this repo.

**Status `[NEEDS VERIFICATION]`.** Construct 14 closed with `freeze/v3-foundation-2026-05-07` as the v3 starting point. The new working rule may now be "branch from the freeze tag for v3 work" rather than "branch off main." Confirm before next ConstructIInv module starts.

**Implication.** When a design doc says "branch X off staging," translate that to "branch X off main" (or off the freeze tag, pending verification) until the orphan situation is fully resolved.

**One-line.** New modules off `main` (or freeze tag — verify). No new branches off `staging`.

---

## ADR-7 · Trust score system: max 763, 5 events at launch, 13 signals later

**Decision.** Trust score maximum is **763** (never change). Tier ladder: Bronze 1–199 / Silver 200–399 / Gold 400–599 / Excellent 600–763. v3 ships with **5 trust score events live**: `invite_accepted` (+25), `invoice_approved_on_time` (+22), `missing_lien_waiver` (−12), `format_error` (−8), `fast_resubmission` (+10). The full 13-signal breakdown ships post-launch.

**Rationale.**
- 763 is non-obvious by design — signals "proprietary system," not credit-bureau imitation.
- The 5 launch events are the ones that fire from existing approve/reject/upload flows. They produce real scores from day one.
- 13-signal breakdown requires more invoice data than we have on production today. Ship the engine, evolve the signal set as data accumulates.
- `signal_breakdown` is a JSONB column — frontend can render whatever the backend provides without schema changes.

**Privacy rule.** Default: contractor sees score, vendor does not. Per-vendor toggle exposes it. Override reasons NEVER shown to vendor. Credit limits NEVER shown to vendor.

**One-line.** Max 763. 5 events at launch, 13 follow. Score private to contractor by default.

---

## ADR-8 · Roles are relational, not absolute. RoleSwitcher deleted.

**Decision.** A user's role is **per-project**, derived from their relationship to that project — Contractor on projects they own, Sub on projects they were invited to. There is no "account type"; all accounts are the same shape. The `RoleSwitcher.tsx` component currently shipping is a localStorage lie (no DB or routing effect) and is **deleted**.

**Rationale.**
- Construction roles are inherently relational. A plumbing company is a Contractor on its own service jobs and a Sub on a GC's project. Modeling them as different account types creates duplicate-account fraud and a worse product for the dual-role majority.
- The `users.user_role` column is acceptable transitional state — it captures the user's *primary* mode for navigation defaults. The authoritative role for any action is the project relationship.
- Database columns are named for relationships (`contractor_user_id`, `vendor_user_id`), not absolute identities. They never get renamed when UI terminology shifts.
- The localStorage RoleSwitcher created a false sense of state with no security or routing effect. Removing it is a net cleanup.

**Reopen note (May 7, 2026).** This ADR was reopened from its original framing ("One account = one role permanently"). See Reopen log at the bottom for the original.

**Implication.** No `RoleSwitcher.tsx`. No `RoleContext`. Role is read from the project membership for any project-scoped action; `users.user_role` is read from `/api/auth/me` once at login for sidebar defaults only.

**One-line.** Roles are relational, derived per project. RoleSwitcher deleted. `users.user_role` is a navigation hint, not authorization.

---

## ADR-9 · Lien lives inside ProjectDetail (alongside Pay Apps), plus top-level Lien Alerts surface

**Decision.** Lien feature is integrated into the ProjectDetail pipeline as Stage 2 (Lien Documents). It is also a top-level sidebar surface (Lien Alerts) showing all California projects with countdown timers across the contractor's portfolio.

**Rationale.**
- Project-context lien work happens inside the project (generate prelim, mark filed, archive).
- Cross-project lien work happens at the portfolio level (which projects need action this week, deadline calendar).
- Both views read from the same backend. Frontend just has two consumers of `/api/aria/lien-alerts`.
- The `?status=` filter (`action_needed | overdue | filed | all | unfiled`) is already wired backend-side.

**Implication.** Lien Alerts page = same data as ProjectDetail Lien stage, but grouped across all projects, with three sections (Action Needed / Overdue / Filed) using the existing filter.

**One-line.** Lien is both project-scoped (inside ProjectDetail) and portfolio-scoped (sidebar surface), one backend.

---

## ADR-10 · Email ingestion stays. Cloudflare Workers, free tier, permanent.

**Decision.** Email ingestion via Cloudflare Email Workers is permanent. Per-trade aliases (e.g., `plumbing-123elm@hub.constructinv.com`) are the magic — vendor forwards from any email client, doc appears in Hub inbox.

**Rationale.**
- Free tier (100 emails/day) is more than enough for 0–200 users.
- Cloudflare is rock solid; near-zero maintenance.
- The 80-line inbound handler in `server/routes/hub.js` is the only owned code.
- When usage hits 100+ daily, swap Cloudflare for Mailgun (~$35/month) — 1-day swap, no code changes.

**Outstanding cleanup.** `cloudflare-hub-email-worker.js` currently has a hardcoded `HUB_INBOUND_SECRET` — that's a known violation (see `OPS-13`) tracked in `BACKLOG.md`. Must be rotated before any other change to that worker.

**One-line.** Email ingestion via Cloudflare Workers is permanent, free tier sufficient. Rotate inbound secret before next worker change.

---

## ADR-11 · Orbital hover-freeze pattern uses a ref, not state

**Decision.** `hoveredRef` ref-based pattern (not state-based) for orbital canvas. Hover any planet → all orbits freeze. Hovered planet scales up slightly. Mouse leaves → orbits resume from current angles.

**Rationale.**
- State-based hover would re-render the entire canvas on every mouse-move.
- Ref-based skips React re-render entirely — animation tick reads `hoveredRef.current`, skips updates if true.
- Pattern is already proven in `HubTab.tsx` orbital canvas; v3 keeps it.

**Implication.** Use the existing pattern. Do not refactor to state. Do not "modernize" to a hooks-based store.

**One-line.** Orbital hover-freeze uses `hoveredRef` (ref, not state). Don't refactor.

---

## ADR-12 · Stripe Connect Express + `application_fee` model. Fees locked. Live keys only.

**Decision.** All transaction money flow uses Stripe Connect Express + `application_fee_amount`. Varshyl takes `application_fee_amount` (e.g., $25 for ACH), contractor's connected account receives the rest. **Fees are locked**: $25 flat ACH, 3.3% + $0.40 CC, 1.5% early-pay (to contractor as margin, not Varshyl). **Live keys only** — `sk_live_*` is non-negotiable.

**Rationale.**
- Already live and working in production.
- Stripe handles all KYC/identity verification — Varshyl never sees sensitive data.
- Per-contractor connected accounts mean each user sees their own world (own bank, own payouts, own dashboard via `dashboard-link`).
- Fee changes affect real customer money. Any change requires explicit Vagish approval.

**Implication.** Vendor Stripe onboarding (when early-pay launches) **copies this exact pattern** — do not reinvent. New endpoints `POST /api/stripe/sub-connect`, `GET /api/stripe/sub-account-status` — same internals, different `user_role`. Switching to test keys breaks real payments and is a prohibited action.

**One-line.** Stripe Connect Express + application_fee. Fees locked. Live keys only. Vendor onboarding copies the pattern, doesn't reinvent.

---

## ADR-13 · Code uses relationship-named columns. UI defaults to "Sub". Always Contractor, never GC.

**Decision.** Database columns are named for the relationship (`contractor_user_id`, `vendor_user_id`), not absolute identities. UI copy uses "Sub" as the default term, with "Vendor" and "Trade" as acceptable interchangeable variants. **"GC" never appears in user-visible strings**. Owner has no login (payment links only).

**Rationale.**
- "Contractor" works for any field-personnel business: GC, glazing factory, specialty trade, service company.
- Relationship-named columns survive UI terminology pivots without rename migrations.
- "Sub" is the most natural default in U.S. construction usage. "Vendor" reads as supplier/material-only; "Trade" reads as technical.
- "GC" is a category narrowing the platform doesn't have.

**Reopen note (May 7, 2026).** This ADR was reopened from its original framing ("Code = vendor"). See Reopen log at the bottom for the original.

**Implication.** Schema columns never change names when UI copy changes. UI copy review is a separate operation from DB review.

**One-line.** Code: relationship-named columns. UI: "Sub" default. Always Contractor, never GC. Roles are relational (see ADR-8).

---

## ADR-14 · Inline async-errors patch + global rejection handlers (until Express 5)

**Decision.** Until Express upgrades to 5.x, `server/app.js` uses an inline IIFE async-error patch (50-line equivalent of `express-async-errors`) plus global `unhandledRejection` and `uncaughtException` handlers that log to Sentry and continue serving traffic.

**Rationale.**
- Bare `await` in route handlers without try/catch causes unhandled rejections (Lesson 4). May 6 audit found 30 vulnerable handlers.
- The inline patch is sufficient and avoids a dependency. Sunsets when Express 5 lands.
- Global handlers prevent process crashes from a single bad Postgres blip taking down all traffic.

**Implication.** Patch lives in `server/app.js` as of `7f9aae54`. Sunset condition: Express 5 in `package.json`. When that happens, delete the patch and confirm Express 5's native async support handles the same cases.

**One-line.** Inline async-errors patch + global rejection handlers. Sunsets at Express 5.

---

## ADR-15 · UI strings: Contractor, Vendor, Owner. Never GC.

**Decision.** User-visible strings only ever say Contractor, Vendor, Sub, Trade, or Owner. The string "GC" (or "G.C.", "general contractor") never appears in the product UI, marketing copy, emails, or PDFs.

**Rationale.** Same reasoning as ADR-13. Surfacing "GC" anywhere narrows the product's positioning to general contractors and excludes the broader contractor base the platform serves.

**Implication.** Pre-merge grep on every PR: `grep -in "\bGC\b\|general contractor" $(git diff --name-only main..HEAD -- '*.tsx' '*.ts' '*.html' '*.md')`. Hits in non-test files block the merge.

**One-line.** UI strings: Contractor, Vendor, Owner. Never GC.

---

## ADR-16 · Dockerfile only. Nixpacks banned. Bible §2.2 review on infra commits.

**Decision.** ConstructIInv's Railway service uses `builder = "dockerfile"` exclusively. Nixpacks is BANNED. Any commit that touches `Dockerfile`, `railway.toml`, `railway.json`, `nixpacks.toml`, or related infra files requires explicit Bible §2.2 review. Add `[x] Bible §2.2 reviewed` to the commit message.

**Rationale.** Nixpacks is broken on Node 22 (CXXABI_1.3.15 ABI mismatch). May 6, 2026 commit `7f9aae54` silently flipped builders + deleted Dockerfile, freezing prod for 3 hours (Lesson 11).

**Refinement (May 8, 2026).** The `varshyl-toolkit` discovered that Railway's nixpacks builder *with* `dockerfilePath` set actually uses the Dockerfile and skips nixpacks's auto-detection. This is acceptable in the toolkit context (verified in v0.0.1 deploy logs). It does **not** relax the rule for ConstructIInv — the production codebase keeps strict `builder = "dockerfile"` until ABI risks are gone. See ADR-24.

**One-line.** Dockerfile only for ConstructIInv. Nixpacks banned. Bible §2.2 review on every infra commit.

---

## ADR-17 · `package-lock.json` (or `pnpm-lock.yaml`) always committed. Never gitignored.

**Decision.** The lockfile is a first-class repo artifact. Every repo Vagish owns must have its lockfile committed, never excluded by `.gitignore`. Every `package.json` change ships with a regenerated lockfile in the same atomic commit.

**Rationale.** Without a committed lockfile, every Railway build resolves dependencies fresh — a bad transitive version silently breaks production. May 6, 2026 PDF regression: lockfile was gitignored, `7f9aae54` added puppeteer without one, prod silently lost Chromium across builds (Lesson 16).

**Implication.** New repo audit: `grep -i "lock" .gitignore` must return empty for the lockfile pattern. If it doesn't, that's the first commit.

**One-line.** Lockfile committed. Never gitignored. Same atomic commit as `package.json` changes.

---

## ADR-18 · Bible v5 = 7 small docs + router

**Decision.** The product Bible (currently v4, single ~14-section Word doc) is restructured into 7 small focused Markdown docs plus a router doc that links them. Drafting order: `LESSONS.md` → `DECISIONS.md` (this file) → `OPS_RULES.md` → `BACKLOG.md` → `MODULES.md` → `PRODUCTION_STATE.md` → `BIBLE_v5.md` (the router, last).

**Rationale.**
- The single-Bible model couples stable content (lessons, decisions) to volatile content (current module status, current backlog). Editing the volatile parts means re-shipping the whole Bible.
- Small docs let Cowork sessions read only what's relevant — sometimes that's just `OPS_RULES.md`, sometimes just `MODULES.md`. The router doc resolves "which doc has the thing I need."
- Each doc has a clear lifecycle: `LESSONS.md` and `DECISIONS.md` are append-only with reopen logs. `MODULES.md` and `PRODUCTION_STATE.md` get rewritten weekly. `BACKLOG.md` is dynamic. `OPS_RULES.md` only changes when a new lesson promotes a rule.

**Implication.** This Bible & Research chat owns the doc-set drafts. Once committed, every Cowork startup reads the router doc first, then drills into specifics.

**One-line.** Bible v5 = 7 small docs + router. Drafted here, committed to repo.

---

## ADR-19 · SOREN is a v4 commitment. Out of v3 scope.

**Decision.** SOREN (voice-first field assistant overlay) is locked into v4 scope. Zero v3 dependencies. Full design happens in a separate dedicated chat post-v3 launch. Tracked in `BACKLOG.md` as a v4 commitment.

**Rationale.**
- v3 is already a frontend rebuild (ADR-1) plus the cataloged module wirings. Adding SOREN bloats v3 risk.
- SOREN sits *on top of* the v3 API surface with zero backend changes. Voice for intent, touch for confirmation, show-don't-search for ambiguous fields. The architecture explicitly keeps it out of v3 backend territory.
- Ship v3 first, prove the foundation, then build SOREN on a stable platform.

**One-line.** SOREN is v4. Zero v3 scope. Tracked in BACKLOG.

---

## ADR-20 · Per-project role derivation is future-state. Don't deepen `users.user_role` dependency.

**Decision.** True per-project role derivation (read role from the project membership for every action) is future-state. v3 ships with `users.user_role` as a navigation hint and project-scoped queries that filter on `contractor_user_id` / `vendor_user_id` directly. **Do not deepen any code path's dependency on `users.user_role` as if it were authoritative.**

**Rationale.** ADR-8 establishes that roles are relational. Right now, the codebase has both patterns mixed — some queries use `users.user_role`, others use the relationship columns. Until per-project derivation is fully built (a v4 task), new code must use the relationship columns directly so the migration path stays open.

**Implication.** New routes and components query relationship columns. Refactoring existing `users.user_role`-dependent code is opportunistic, not mandatory. Tracked in `BACKLOG.md`.

**One-line.** Per-project role derivation is future-state. New code uses relationship columns directly. Don't deepen `users.user_role` dependency.

---

## ADR-21 · `varshyl-toolkit` lives at `VagishKapila/varshyl-toolkit`, not under a GitHub org

**Decision.** The shared module toolbox lives at `https://github.com/VagishKapila/varshyl-toolkit`, under Vagish's personal GitHub account. Not under a `varshyl` or `varshyl-inc` organization.

**Rationale.**
- Every other Varshyl repo (construction-ai-billing, varshyl-voice, formiq, daily-log-ai, openpdf-studio-staging, file-server-agent, gpt-material-insight-api) lives under `VagishKapila/`. New things default to where the existing pattern lives (Lesson 21).
- Vagish is the only developer. The "org" pattern solves multi-developer / multi-team / external-collaborator problems he doesn't have.
- GitHub.com has no org-creation API for personal accounts (Lesson 22). Even if an org were the right answer, the bootstrap would have required a manual click — not zero-touch.
- Migration to an org later (when an actual second developer joins) is a one-time GitHub repo transfer, plus a coordinated bump of every product's `package.json` pin. Cost is real but bounded and deferred until justified.

**Implication.** Products consume modules via `github:VagishKapila/varshyl-toolkit#<module>-v<X.Y.Z>`. If/when migration happens, every consuming product's `package.json` pin is updated in the same coordinated bump.

**One-line.** Toolkit lives at `VagishKapila/varshyl-toolkit`. Personal account, not org. Migration deferred.

---

## ADR-22 · Toolkit architecture: single monorepo, modules as versioned packages, products pin git tags

**Decision.** The shared module strategy is a single `varshyl-toolkit` monorepo containing modules as independently-versioned packages. Products keep their own repos and consume modules by pinning specific git tags (e.g., `team-management-v1.0.0`). Per-package semver. Per-package CHANGELOG. No cross-package imports.

**Rationale and full detail in `SHARED_MODULE_ARCHITECTURE.md`.** Locked decision summary: one repo for Cowork to clone (less ceremony), one PR can update modules that work together, version pinning protects products from breaking changes, products upgrade on their own schedule. Modules already inline in ConstructIInv (Trust Score, Vendor Invites) stay inline for now — extracted only when "earned in" per Phase 2 criteria. Team Management is the toolbox's first occupant.

**Implication.** Every package in `packages/` exports the same shape: `createServerModule({ adapter, db, config })`, `runMigrations()`, client `Pages` and `Components`. Modules talk to host products through an adapter the product writes — modules never SELECT from product tables directly. CI enforces no cross-package imports.

**One-line.** Single monorepo. Modules as versioned packages. Products pin git tags. Adapter pattern at the boundary. Full spec in `SHARED_MODULE_ARCHITECTURE.md`.

---

## ADR-23 · Toolkit uses pnpm workspaces, not Turborepo

**Decision.** The `varshyl-toolkit` monorepo uses pnpm workspaces for package management. Not Turborepo, not Nx, not Lerna.

**Rationale.**
- Toolkit has 1 package today, possibly 4–5 in 12 months. Turborepo's caching layer adds complexity without benefit at this scale.
- pnpm workspaces is the simpler primitive Turborepo builds on, so Turborepo can be added later without rewriting.
- GitHub Actions caching of pnpm store is sufficient for CI speed at this size.

**Implication.** Root has `pnpm-workspace.yaml`. Lockfile is `pnpm-lock.yaml` (also subject to ADR-17). All scripts at root use `pnpm -r` or `pnpm --filter @varshyl/<package>`.

**One-line.** pnpm workspaces in the toolkit. Turborepo deferred until 4+ packages prove the need.

---

## ADR-24 · Toolkit's nixpacks-with-`dockerfilePath` is acceptable when verified. ConstructIInv's strict ban stands.

**Decision.** The `varshyl-toolkit` demo-host service runs on Railway with builder set to `nixpacks` *but with* `dockerfilePath: apps/demo-host/Dockerfile`. In this configuration, Railway uses the Dockerfile and skips nixpacks's auto-detection. This is acceptable for the toolkit. **ConstructIInv's `builder = "dockerfile"` strict requirement (ADR-16) is unchanged.**

**Rationale.**
- Railway's API removed the `DOCKERFILE` enum value from the builder field. The new pattern (nixpacks builder + explicit `dockerfilePath`) is functionally equivalent and was verified in v0.0.1 deploy logs (May 8, 2026).
- ConstructIInv's strict ban exists because of a real production incident. Re-litigating it for a different repo would be over-broad.
- Future Cowork sessions deploying anything to Railway must verify the Dockerfile is actually being used (check build logs for the line confirming Dockerfile usage), regardless of what the builder field is set to (Lesson 23).

**Implication.** The verification step is now a deploy-checklist item, not a builder-field check. Add `[x] Dockerfile build verified in logs` to any commit that touches Railway service config.

**One-line.** Toolkit may use nixpacks-with-dockerfilePath when verified. ConstructIInv strict ban stands. Verify Dockerfile usage in logs every time.

---

## ADR-25 · Toolkit demo-host runs on a single Railway environment. No staging.

**Decision.** The `varshyl-toolkit` Railway project has one environment (production) with one Postgres add-on (smallest tier) and one demo-host service. No separate staging environment.

**Rationale.**
- Demo-host is a verification harness, not a product. It exists to prove modules work end-to-end against real Postgres before products consume them.
- Adding a staging environment doubles Railway cost without proportional value at this scale.
- Cost ceiling: Vagish's $20/month soft cap. Current cost ~$5–10/month at idle. If creep crosses the cap, revisit.

**Implication.** All toolkit changes test in CI (with ephemeral Postgres) first, then deploy to production demo-host on merge to `main`. No multi-environment promotion ceremony.

**One-line.** Toolkit demo-host: one Railway env, smallest Postgres, $20/month soft cap. Verification shape, not showcase shape.

---

## ADR-26 · Team Management is the first toolkit occupant. Existing inline modules stay inline until earned in.

**Decision.** Team Management is built directly in `varshyl-toolkit` from day one. It is the first occupant. The existing inline modules in ConstructIInv — Trust Score, Vendor Invites, ARIA Lien Module, ARIA chat — stay inline. Extraction happens only when each module meets earn-in criteria (see `SHARED_MODULE_ARCHITECTURE.md` §6.2).

**Rationale.**
- Speculative extraction is forbidden. The toolbox earns its keep one module at a time.
- Team Management is genuinely cross-product (ConstructIInv, BrandOS, future). Trust Score might be cross-product but currently has only one consumer; Vendor Invites is similar.
- ARIA Lien Module is California-specific and ConstructIInv-specific. Likely never extracted.
- ARIA chat is too entwined with ConstructIInv's domain prompts. Possibly never extracted.

**Implication.** No "let's also move Trust Score to the toolkit while we're at it" energy. Team Management ships v0.0.1 (stub, May 8, 2026), then v0.1.0 (real features) after the Team Management design chat resolves the 8 open questions in `BACKLOG.md`.

**One-line.** Team Management is toolkit occupant #1. Existing inline modules stay inline. Extraction is earned, not assumed.

---

## Reopen log

When reopening a decision, add a row here with date, ADR number, and named reason. Don't just edit the ADR — append a Reopen note inside the ADR pointing to this log, and write the new state above. The original stays for archaeology.

### ADR-8 reopened — May 7, 2026

**Reason.** Original framing ("One account = one role permanently") was wrong on the relational nature of construction roles. A user can legitimately be Contractor on their own projects and Sub on others'. The corrected ADR is in place above.

**Original ADR-8 (May 6, 2026).** "One account = one role permanently. RoleSwitcher deleted. Each user has exactly one role (`users.user_role` ∈ {contractor, vendor, owner}). The RoleSwitcher.tsx component currently shipping is a localStorage lie — it does not change DB role or routing. Delete it. Rationale: Contractor and Vendor are categorically different account types. A single human can have two accounts (one contractor, one vendor) with different emails. That covers the dual-role use case without confusing the permission model. Implication: Delete RoleSwitcher.tsx. JWT contains {id, email} only. Role fetched fresh via /api/auth/me."

### ADR-13 reopened — May 7, 2026

**Reason.** Original framing said "Code = `vendor`" as if vendor were an absolute identity. The corrected version frames code columns as relationship-named, with no rename when UI terminology changes. UI default also clarified to "Sub" rather than "interchangeable with no preference."

**Original ADR-13 (May 6, 2026).** "Code = vendor. UI = Vendor/Sub/Trade. Always Contractor, never GC. Owner = no login."

### ADR-16 refined — May 8, 2026

Not a full reopen — the rule is unchanged for ConstructIInv. ADR-24 was added to capture the toolkit-specific nuance without weakening the ConstructIInv rule. See ADR-24 for the qualifier.

---

## Quick scan (for build agents)

| ADR | One-line summary |
|---|---|
| ADR-1 | v3 = new frontend over existing backend |
| ADR-2 | ProjectDetail = pipeline + ARIA bar + action grid, no tabs |
| ADR-3 | Vendor = teal `#0F766E`, contractor = blue `#2563eb`, orbital = dark `#020817` |
| ADR-4 | Mobile-first, one design system, 44px touch targets |
| ADR-5 | Contractor 7 surfaces, Vendor 3, Lien promoted top-level |
| ADR-6 | New modules off `main` (or freeze tag — verify). No new branches off `staging` |
| ADR-7 | Trust max 763. 5 events at launch, 13 follow. Score private to contractor |
| ADR-8 | Roles relational, derived per project. RoleSwitcher deleted. `users.user_role` is nav hint only |
| ADR-9 | Lien is project-scoped + portfolio-scoped, one backend |
| ADR-10 | Cloudflare Workers for inbound email permanent. Rotate inbound secret before next change |
| ADR-11 | Orbital hover-freeze uses ref, not state. Don't refactor |
| ADR-12 | Stripe Connect Express + application_fee. Fees locked. Live keys only |
| ADR-13 | Code: relationship-named columns. UI: "Sub" default. Always Contractor, never GC |
| ADR-14 | Inline async-errors patch + global rejection handlers (until Express 5) |
| ADR-15 | UI strings: Contractor, Vendor, Owner. Never GC |
| ADR-16 | Dockerfile only for ConstructIInv. Nixpacks banned. Bible §2.2 review on infra commits |
| ADR-17 | Lockfile committed. Never gitignored. Same atomic commit as `package.json` changes |
| ADR-18 | Bible v5 = 7 small docs + router |
| ADR-19 | SOREN is v4. Out of v3 scope |
| ADR-20 | Per-project role derivation is future-state. Don't deepen `users.user_role` dependency |
| ADR-21 | Toolkit at `VagishKapila/varshyl-toolkit`. Personal account, not org |
| ADR-22 | Single monorepo, modules as versioned packages, products pin git tags. Adapter pattern at boundary |
| ADR-23 | pnpm workspaces in toolkit. Turborepo deferred |
| ADR-24 | Toolkit may use nixpacks-with-dockerfilePath when verified. ConstructIInv strict ban stands |
| ADR-25 | Toolkit: one Railway env, smallest Postgres, $20/month soft cap |
| ADR-26 | Team Management is toolkit occupant #1. Existing inline modules stay inline. Extraction is earned |

---

*End of DECISIONS.md. Next document in queue: `OPS_RULES.md`.*
