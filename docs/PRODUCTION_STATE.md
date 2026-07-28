# PRODUCTION_STATE.md

> **Role in the doc set:** Snapshot of current production reality. What's actually live, what's broken, what's degraded, what's deferred. Updated weekly (or after any significant production change).
>
> **Why it exists.** Cowork sessions need to know "what does production look like RIGHT NOW" before making decisions. Bible docs describe how things should work; this doc describes how they actually do.
>
> **Style B note.** Items marked `[NEEDS VERIFICATION]` are claims based on the most recent session's output that haven't been re-verified against live production today. Cowork should verify before committing to a fix.
>
> **Last updated:** May 10, 2026.

---

## Update cadence

This file is rewritten (not appended) every Monday and after any major production change (deploy of a new module, recovery from incident, etc.). The git history holds the archaeology of past states — this file always represents NOW.

When updating: walk through each product, confirm the status of each module against live (curl the endpoints, hit the URLs, check the Railway dashboard), update the entries.

---

## ConstructIInv AI — `constructinv.varshyl.com`

**Status.** LIVE. Real users. Real money flowing.

**Production HEAD `[NEEDS VERIFICATION]`.** Last confirmed `5a33b7d` on May 7, 2026 (PR 2A vendor address book backend shipped). Freeze tag at that point: `v3-foundation-2026-05-07`. May have advanced since.

**Stack on production.**
- Railway service: `construction-ai-billing`
- Builder: Dockerfile (Bible §2.2 — nixpacks banned)
- Database: PostgreSQL via Railway
- Email: Resend (`reminder@varshyl.com`)
- Stripe: `sk_live_` keys (Varshyl account `acct_1TG76NAHP8NRRyLC`)
- AI: Anthropic Claude API
- Inbound email: Cloudflare Email Workers (`@hub.constructinv.com`)

**Branch state `[NEEDS VERIFICATION]`.**
- `main` — production branch
- `staging` — orphan branch state from early May 2026; may or may not be reconciled
- Working pattern (per ADR-6): new modules off `main`, not `staging`

### What's live and working

| Feature | Status | Notes |
|---|---|---|
| G702/G703 pay app generation | ✅ Live | Protected by 13 unit tests. NEVER BREAK. |
| SOV parsing (Excel/CSV/PDF/DOCX) | ✅ Live | Tested against Bains contractor proposal |
| Stripe ACH payments ($25 flat) | ✅ Live | Live keys verified |
| Stripe CC payments (3.3%+$0.40) | ✅ Live | Live keys verified |
| Stripe Connect Express onboarding (contractors) | ✅ Live | Working pattern for vendor onboarding to copy |
| Pay app email send to owner | ⚠ See A2 | Stripe gate may or may not be fully fixed `[NEEDS VERIFICATION]` |
| Webhook handling (9 event types) | ✅ Live | Includes async ACH confirmation |
| Public pay page at `/pay/:token` | ✅ Live | No auth, shows invoice + payment form |
| California preliminary lien generation | ✅ Live | 20-day deadline countdown. Module is protected. |
| Retention breakdown | ✅ Live | Working module — do not touch |
| Hub uploads + inbox | ✅ Live | Email ingest, magic link, portal all active |
| Vendor invite (magic link + 6-digit code) | ✅ Live | Per userMemories May 7 forensic |
| ARIA chat | ✅ Live | System prompt covers trust + orbital features |
| ARIA Cash Flow Collision detection | ✅ Live | Daily 07:00 UTC cron |
| ARIA Daily Digest email | ✅ Live | Daily 18:00 UTC cron |
| ARIA Insurance Expiry watchdog | ✅ Live | Daily 08:00 UTC cron |
| ARIA Hero Card (dynamic) | ✅ Live | `/api/aria/hero-message` |
| Vendor Trust Score v2 | ✅ Live | 4 signals; 13-signal upgrade is V4 |
| Orbital Universe (contractor view) | ✅ Live | hoveredRef pattern (ADR-11) |
| Vendor Welcome Screen | ✅ Live | 25pt starting score on invite accept |
| Vendor Portal (Orbital, orange theme — `[NEEDS VERIFICATION]`) | ✅ Live per memory; color may now be teal per ADR-3 | Confirm against shipping code |
| Mobile UI (<768px purpose-built) | ✅ Live | Per userMemories |
| ARIA Learning Engine | ✅ Live | `learnEvent()` wired to hub approvals/rejections |
| Contractor notifications + bell | ✅ Live | |
| QuickBooks OAuth | ✅ Live | Connect + callback + status all 200 |
| Trial system ($64/mo Pro, 90-day free) | ✅ Live | |
| Admin dashboard | ✅ Live | |
| Reporting module | ✅ Live | Filter/sort/export pay apps |

### What's degraded

| Feature | State | Action |
|---|---|---|
| Pay App PDF | Degraded to PDFKit fallback (215-line plain) | Restore Puppeteer rich rendering (443-line). Tier A3. |
| QuickBooks sync depth | Partial (AR creation, basic project sync) | AP, job costs, payment reconciliation not built. Tier E. |

### Known production debt

| Item | Severity | Action |
|---|---|---|
| Hardcoded `HUB_INBOUND_SECRET` in committed Cloudflare worker | High (security) | Tier A1. Rotate before next worker change. |
| Stripe gate on "Send to Owner" — Bug D fix deployment uncertain | High (revenue) | Tier A2. Smoke test in production. |
| V1 trust score orphan returns 500 on every call | Low (dead code, no UI consumes it) | Tier B3. Delete the directory. |
| Vendor dashboard backend uncommitted | Medium | Tier B1. |
| Reject/resubmit/version-thread frontend UI missing | Medium | Tier B2. Backend complete. |
| 5 modules built but unmounted (~2,019 lines) | Medium | Tier B (V3 launch sprint). |

### Test accounts (staging — `[NEEDS VERIFICATION]` of credentials)

| Account | Email | Notes |
|---|---|---|
| Vagish admin | vaakapila@gmail.com | Full access |
| Sarah Chen test | sarah.chen.test@constructinv.com | 4 CA projects, $765K (per Bible v4) |
| Alex Thompson test | alex.thompson.test@constructinv.com | 3 CA projects, $500K, SOVs seeded |

### Cron jobs running

| Time (UTC) | Job | File |
|---|---|---|
| 07:00 | Cash flow collision detection | `cashFlowCollision.js` |
| 08:00 | Insurance expiry scan | `insuranceCron.js` |
| 12:00 | Payment follow-up | (follow-up scheduler) |
| 18:00 | Daily document digest email | `dailyDigest.js` |
| 03:00 | Stale lien alert cleanup | `staleAlerts.js` |

### Money flow status

| Stream | State |
|---|---|
| GC $64/mo Pro subscriptions | Live, working |
| Owner ACH payments ($25 flat to Varshyl) | Live, working |
| Owner CC payments (3.3% + $0.40 to Varshyl) | Live, working |
| Sub early payment (1.5% to GC margin) | Backend built, frontend not wired (Tier B) |

### What to verify before any production change

The "do not break" list:
- G702/G703 math (13 unit tests protect it)
- Stripe live keys (never switch to test)
- Stripe fee amounts ($25 ACH, 3.3%+$0.40 CC, 1.5% early pay)
- California lien module (working, do not touch)
- Retention breakdown (working, do not touch)
- Cloudflare Email Workers (live, working, secret rotation pending per A1)

---

## `varshyl-toolkit` — `demo-host-production.up.railway.app`

**Status.** LIVE (verification harness only — not a product).

**Repo.** `VagishKapila/varshyl-toolkit`

**Railway project ID.** `dfc9a5aa-b63b-4275-93d8-55173eb1eda5`

**Demo host URL.** `https://demo-host-production.up.railway.app`

**Production HEAD.** Main, post-merge of `feature/team-management-v0.1.0` (May 9, 2026).

**Cost.** ~$5–10/month at idle. Under $20/month soft cap (ADR-25).

**Stack.**
- Railway service: `demo-host`
- Builder: nixpacks with explicit `dockerfilePath` (ADR-24)
- Database: PostgreSQL via Railway add-on, smallest tier
- App: Express + React + Vite + Tailwind in one container

### What's live

| Surface | Status | URL |
|---|---|---|
| `/api/health` | ✅ 200 | Server health |
| `/api/team/health` | ✅ 200 | Team Management module health, DB connected |
| `/` | ✅ 200 | React shell renders |
| `/team/members` | ✅ 200 | 4 seeded members visible with roles |
| `/team/audit` | ✅ 200 | Audit log paginated |
| `/admin` (super-admin) | ✅ 200 | Demo Construction Co. visible in org list |

### Seeded demo data

- Org: "Demo Construction Co."
- Members:
  - Sarah Chen — Owner (also seeded as super-admin)
  - Mike Rodriguez — Admin
  - Jane Smith — Member
  - Tom Wilson — Viewer
- One additional unaffiliated user: Alex (no org yet)

### Modules installed in demo-host

- `@varshyl/team-management@v0.1.0` — full features, all flags enabled including `enableSuperAdmin`

### Test infrastructure

- Vitest config with global setup that runs migrations once
- Ephemeral Postgres service container in CI
- 291 tests passing, 6 skipped, 0 failing (as of May 9, 2026)
- Layer 9 screenshots committed to `qa-evidence/team-management-v0.1.0/`

### Known toolkit-level debt

| Item | Severity | Action |
|---|---|---|
| Branch protection on `main` requires GitHub Pro | Low | Enforced by convention + CI; consider Pro if priority shifts |
| `RUNBOOK.md` not yet written | Low | Tier C4 in BACKLOG |
| No second module released yet | Medium | Tier D1 (`stripe-subscriptions`) next |
| No real product consumer yet | High | Tier C1 (ConstructIInv) waiting on bug-fix cycle; Tier C2 (BrandOS) after |

---

## Daily Log AI

**Status `[NEEDS VERIFICATION]`.** Not yet captured.

**Known facts.**
- Field photo + description capture, saves as report
- $25/month web subscription
- Mobile app planned (iOS Apple IAP, Android Google Play Billing — Stripe is web-only)
- First consumer of `@varshyl/stripe-subscriptions` (Tier D1)
- Will install `@varshyl/team-management` once Stripe Subscriptions is live

**To capture (next session involving Daily Log AI):**
- Repo URL
- Production URL
- Deploy platform
- Current authentication
- Module inventory
- Current production HEAD
- Live customer count, MRR if any

---

## BrandOS

**Status `[NEEDS VERIFICATION]`.** Not yet captured.

**Known facts.**
- Personal brand management platform
- Free and Pro tiers
- Sub-modules per skill list: Intake, Score, Content, Coach
- Pro tier sells, but pricing not captured here

**To capture.** Same shape as Daily Log AI.

---

## Other products

**Status `[NEEDS VERIFICATION]`.** The following products have been mentioned but not captured here:

- SnapClaps
- DocuFlow
- Sentio Development Inc. (development company, may not be a software product)
- Varshyl Voice
- Formiq
- File Server Agent
- OpenPDF Studio
- GPT Material Insight API

Each gets a production-state section here once it has a CLAUDE.md / BRAIN.md and we've audited its live state.

---

## Cross-product infrastructure status

### GitHub

| Item | State |
|---|---|
| Account | `VagishKapila` (personal account; no Varshyl org — see Lesson 21, Lesson 22) |
| Active repos | construction-ai-billing, varshyl-toolkit, varshyl-voice, formiq, daily-log-ai, openpdf-studio-staging, file-server-agent, gpt-material-insight-api |
| Branch protection | Toolkit: not enabled (requires Pro on personal account). ConstructIInv: `[NEEDS VERIFICATION]` |

### Railway

| Project | State |
|---|---|
| `construction-ai-billing` | Live production, paid tier (specific tier not captured here) |
| `varshyl-toolkit` | Live, smallest tier, ~$5–10/month idle |
| Others | `[NEEDS VERIFICATION]` |

### Stripe

| Item | State |
|---|---|
| Account | `acct_1TG76NAHP8NRRyLC` (Varshyl Inc.) |
| Mode | `sk_live_` confirmed active for ConstructIInv |
| Connect setup | Live for contractors; sub onboarding built but unmounted |
| Daily Log AI Stripe Product | Not yet created (will be added during Stripe Subscriptions design phase) |

### Email

| Item | State |
|---|---|
| Provider | Resend |
| From address | `reminder@varshyl.com` |
| Cloudflare Email Workers | Active for `@hub.constructinv.com` inbound routing |

### Monitoring

| Tool | State |
|---|---|
| Sentry | Live on ConstructIInv (backend + frontend) per April 2026 infra setup |
| BetterStack | Live on ConstructIInv per April 2026 |
| Structured logging | pino, live on ConstructIInv |

---

## Reading order

When starting a session that touches production:

1. Open this file. Find the product.
2. Check "What's live" — confirm the feature you're about to touch is in the working list.
3. Check "What's degraded" and "Known production debt" — confirm you're not stepping into a known broken state.
4. Check `BACKLOG.md` for any active items against your target.
5. Verify any `[NEEDS VERIFICATION]` claims that affect your work before making changes.

---

*End of PRODUCTION_STATE.md. Next document in queue: `BIBLE.md` (the router, final).*
