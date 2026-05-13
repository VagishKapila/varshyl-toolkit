# MODULES.md

> **Role in the doc set:** Registry of every module across the Varshyl portfolio. The fast answer to "what exists, what's its status, where does it live, who consumes it." Toolkit modules and inline product modules both tracked here.
>
> **Source of truth.** This file is canonical for module status. If a module's CHANGELOG, README, or BACKLOG entry disagrees with this file, this file wins until the discrepancy is reconciled.
>
> **Last updated:** May 10, 2026.

---

## How modules are classified

**Toolkit module** — lives in `varshyl-toolkit/packages/<name>/`. Versioned independently. Consumed by products via pinned git tags. Cross-product by design.

**Inline module** — lives inside a specific product's repo (typically `server/features/<name>/`). Not extracted to the toolkit yet. May or may not ever be extracted (extraction is earned, not assumed — see `SHARED_MODULE_ARCHITECTURE.md` §6.2).

**Status definitions:**
- **Active** — shipped, in production, supported. Has a CHANGELOG.
- **Stub** — scaffolded with the right shape but no real features yet. Reserves the package space.
- **Planned** — design committed, build hasn't started.
- **Designed** — design doc exists, ready for Cowork build session.
- **Deprecated** — being phased out. Will not receive new features.
- **Orphan** — dead code still in the repo. Tagged for cleanup.

---

## Toolkit modules (`varshyl-toolkit/packages/`)

| Module | Status | Latest tag | First consumer | Notes |
|---|---|---|---|---|
| `@varshyl/team-management` | **Active** | `team-management-v0.1.0` | ConstructIInv (planned) | First real toolkit release. Production-grade. |
| `@varshyl/stripe-subscriptions` | **Designed** | — | Daily Log AI | Design phase next; see BACKLOG D1 for locked context. |
| `@varshyl/notifications` | Planned | — | TBD | Tier D in BACKLOG. |
| `@varshyl/file-storage` | Planned | — | TBD | Tier D in BACKLOG. |
| `@varshyl/audit-log` (cross-product) | Planned | — | TBD | Tier D in BACKLOG. Separate from team-management's internal audit log. |
| `@varshyl/feature-flags` | Planned | — | TBD | Tier D in BACKLOG. |

### `@varshyl/team-management`

**Status.** Active. Released May 9, 2026.

**Latest version.** `0.1.0`. Tag: `team-management-v0.1.0`.

**Pin syntax for consumers:**
```json
"@varshyl/team-management": 
  "github:VagishKapila/varshyl-toolkit#team-management-v0.1.0"
```

**What it does.** Customer-facing Team page builder for any Varshyl product. Owner/Admin/Member/Viewer roles. Magic-link + 6-digit-code invitations. Audit log. Member removal (soft, audit-preserved). Org deletion (30-day grace). Ownership transfer (two-step). Email change (verify new, notify old). Self-service + super-admin-triggered password reset. Flag-gated super-admin surface for Varshyl back-office.

**Owned tables (prefix `tm_*`):** `tm_organizations`, `tm_memberships`, `tm_invitations`, `tm_audit_events`, `tm_email_change_requests`, `tm_ownership_transfers`, `tm_super_admins`, `tm_password_reset_requests`, `tm_user_locks`, `tm_shared_access` (scaffolded, empty), plus `tm_schema_migrations` ledger.

**Migrations.** 12 forward-only migrations, all idempotent (`IF NOT EXISTS`). Run on module boot via `runMigrations()`.

**Adapter contract.** ~15 methods the host product must implement. Full TypeScript interface in `packages/team-management/src/server/types.ts`. Includes user lookup, password hashing, session invalidation, and ~8 email sending methods (host provides email transport — module never sends email directly).

**Feature flags.** `enableInvites`, `enableAuditLog`, `enableOwnershipTransfer`, `enableEmailChange`, `enablePasswordReset`, `enableSuperAdmin`, `enableSharedAccess`, `enableHardDelete`. All but `enableSuperAdmin` and `enableSharedAccess` default ON.

**Consumers.**
- ConstructIInv — *planned* (Tier C1 in BACKLOG). Waiting on ConstructIInv bug-fix cycle to complete.
- BrandOS — *planned* (Tier C2 in BACKLOG). After C1 lands.
- Future products — install on day one as foundation.

**Locked decisions.** 8 design decisions locked May 10, 2026. See `CHANGELOG.md` in the package for the full block.

**Phase 1 success criteria (`SHARED_MODULE_ARCHITECTURE.md` §6.1):**
- [x] `team-management-v0.1.0` published.
- [ ] ConstructIInv installs and ships it to production. Real customers use it.
- [ ] BrandOS installs and ships it. Real customers use it.
- [ ] At least one bug-fix patch release flows cleanly through both products.

When all four are checked, Phase 1 is complete and Phase 2 (earn-in evaluation of inline modules) begins.

### `@varshyl/stripe-subscriptions`

**Status.** Designed (design chat pending — Tier D1 in BACKLOG).

**Locked context.** See `BACKLOG.md` D1 for the full locked context block — module name, type (subscriptions only, not Connect), pricing model, override module requirement, dependency on `@varshyl/team-management`, Stripe account strategy, webhook approach, customer portal choice.

**First consumer.** Daily Log AI ($25/month, web-based payments via Stripe). Apple IAP and Google Play Billing for mobile apps are out of scope for this module.

**Pending design decisions.** ~10 decisions to lock in the design chat. Listed in BACKLOG D1.

**Dependency.** `@varshyl/team-management` must be installed first (subscriptions are per-org, not per-user).

### Other planned modules

`@varshyl/notifications`, `@varshyl/file-storage`, `@varshyl/audit-log`, `@varshyl/feature-flags` — all in Tier D of BACKLOG. Each requires a design chat before build. Not committed to a sequence yet — Stripe Subscriptions is the next module after Team Management.

---

## ConstructIInv inline modules (`construction-ai-billing/server/features/`)

These live inside ConstructIInv. May or may not ever be extracted to the toolkit.

### Modules that exist and work

| Module | Status | Path | Extraction candidate? |
|---|---|---|---|
| Vendor invites (magic link + code) | **Active** | `server/features/vendor-sub-portal/` | Yes — Tier 2 evaluation after team-management proves the pattern |
| Trust Score v2 (4 signals) | **Active** | `server/features/trust-v2/` | Possible — depends on whether a second product wants vendor scoring |
| Trust Score v1 (orphan) | **Orphan** | `server/features/trust/` | No — slated for deletion (BACKLOG B3) |
| ARIA chat | **Active** | `server/features/aria/` | Unlikely — too entwined with ConstructIInv domain prompts |
| ARIA Lien Module (California) | **Active** | `server/features/aria/lien/california.js` | No — ConstructIInv-specific, state-aware architecture stays inline |
| ARIA Cash Flow Collision | **Active** | `server/features/aria/cashFlowCollision.js` | Unlikely — ConstructIInv-specific |
| ARIA Insurance Cron | **Active** | `server/features/aria/insuranceCron.js` | Unlikely — ConstructIInv-specific |
| ARIA Daily Digest | **Active** | `server/features/aria/dailyDigest.js` | Possible — generic-enough pattern |
| Hub uploads + inbox | **Active** | `server/routes/hub.js` | Possible — generic upload management |
| Hub email ingestion (Cloudflare Workers) | **Active** | `cloudflare-hub-email-worker.js` | Likely never — Cloudflare worker is its own deployment unit |
| QuickBooks OAuth + sync | **Active (basic)** | `server/features/quickbooks/` | Possible — generic accounting integration pattern |
| G702/G703 pay app math | **Active** | `server.js` + protected by 13 unit tests | No — domain-specific to construction billing |
| SOV parsing | **Active** | `server/services/sov-parser.js` | No — domain-specific |
| Stripe Connect (contractor onboarding) | **Active** | `server.js` | Possible after stripe-subscriptions ships — different model though |

### Modules built but not mounted

These are uncommitted local files or unwired backends. Tier B in BACKLOG.

| Module | State | Action |
|---|---|---|
| Vendor dashboard backend | Uncommitted local files | B1 in BACKLOG |
| Reject/resubmit/version-thread frontend | Backend complete, no UI | B2 in BACKLOG |
| `server/features/vendor-book/` (address book) | Built, ~2,019 lines unmounted | Tier B (consolidate with B1) |
| `server/features/repository/` (file repository) | Built, unmounted | Tier B (V3 launch) |
| `server/features/reporting/HubReports/` | Built, unmounted | Tier B (V3 launch) |
| `server/features/early-pay/` (1.5% early payment) | Built, unmounted | Tier B (V3 launch, "quiet feature" per ADR-26) |
| `server/features/stripe-onboard/` (sub Stripe onboarding) | Built, unmounted | Tier B (V3 launch) |

The total backlog of built-but-unmounted code is large enough that it deserves a dedicated wiring sprint, not piecemeal commits.

---

## Daily Log AI modules

**State `[NEEDS VERIFICATION]`.** Daily Log AI is in active development. Module inventory will be captured here when a CLAUDE.md / BRAIN.md exists for the product.

**Known facts (May 10, 2026):**
- Photo + description capture from field, saves as report
- $25/month subscription (web payments via Stripe; iOS/Android use platform IAP)
- Mobile-first (likely PWA or native — to be confirmed)
- First consumer of `@varshyl/stripe-subscriptions` module
- Will install `@varshyl/team-management` once it's the standard install

**Pending captures (to be added when Daily Log AI session happens):**
- Repo URL
- Production URL
- Database schema
- Current authentication system
- Existing inline modules (if any)

---

## BrandOS modules

**State `[NEEDS VERIFICATION]`.** BrandOS exists per userMemories but module inventory hasn't been captured.

**Known facts:**
- Personal brand management platform
- Has Free tier and Pro tier
- Multiple sub-skills: BrandOS Intake, BrandOS Score, BrandOS Content, BrandOS Coach (per Claude skills list)

**Pending captures:** Same shape as Daily Log AI.

---

## Other products (`[NEEDS VERIFICATION]`)

The following products were mentioned in userMemories or skill descriptions but their module state isn't documented here yet:

- SnapClaps
- DocuFlow
- Sentio Development Inc. (general contracting / development — not necessarily a software product)
- Varshyl Voice
- Formiq
- File Server Agent
- OpenPDF Studio
- GPT Material Insight API

Each of these gets a section in this file once it has its own CLAUDE.md / BRAIN.md and we know its module shape.

---

## Module status changelog

When a module changes status (Stub → Active, Active → Deprecated, etc.), record it here.

| Date | Module | From → To | Trigger |
|---|---|---|---|
| 2026-05-08 | `@varshyl/team-management` | Stub → Stub (v0.0.1 release) | Toolkit bootstrap |
| 2026-05-09 | `@varshyl/team-management` | Stub → Active (v0.1.0) | First real release |
| 2026-05-10 | `@varshyl/stripe-subscriptions` | (none) → Designed | Design phase committed, locked context in BACKLOG D1 |

---

## Reading order

When starting a session that involves a module:

1. Find the module in the table above.
2. Read its expanded section (if it has one).
3. Read the module's own `README.md` and latest `CHANGELOG.md`.
4. Check `BACKLOG.md` for any pending items against that module.

When deciding whether to build a new toolkit module:

1. Check this file — does it already exist (active, stub, or planned)?
2. Check `BACKLOG.md` Tier D — is it already in design queue?
3. Check `SHARED_MODULE_ARCHITECTURE.md` §6.2 — does it meet earn-in criteria?
4. Open a design chat before any build.

---

*End of MODULES.md. Next document in queue: `PRODUCTION_STATE.md`.*
