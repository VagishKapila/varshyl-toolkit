# BACKLOG.md

> **Role in the doc set:** What's coming next. Every wish-list item, deferred bug, half-built module, and future commitment across the Varshyl portfolio. Tier-prioritized so Cowork sessions and Vagish both know what to pick up.
>
> **Scope.** This is the **canonical** backlog. Items that exist only in chats, emails, or Vagish's head are not "backlog" — they're noise. Capture-it-or-lose-it: when a new item emerges in any session, it lands here before that session ends (OPS-6).
>
> **Style B note.** Some items have explicit `[NEEDS VERIFICATION]` flags — these are claims of current state that we haven't confirmed against production today. The flag does not block work; it tells future-Cowork to verify before assuming.
>
> **Last updated:** May 10, 2026.

---

## How the tiers work

Tiers describe **urgency and dependency**, not effort. A tier-A item might be 20 minutes of work; a tier-D might be a week. The tier answers "when do we touch this?"

- **Tier A — Must fix before next launch.** Blocks the next major release. Security violations, payment-flow bugs, anything customer-facing that's currently broken.
- **Tier B — Active build queue.** Wired or near-wired modules that need to ship in the next 1–2 sessions.
- **Tier C — Designed but not built.** Decision is locked, design doc exists, Cowork could start tomorrow.
- **Tier D — Needs design.** Idea is clear, but design decisions haven't been resolved yet. Requires a design-chat session before a build session.
- **Tier E — Wish-list.** Useful but not blocking anything. Picked up when capacity allows.
- **V4 — Long-horizon commitments.** Things explicitly scoped out of the current major version (v3 for ConstructIInv) but locked as commitments for the next one.
- **Parked.** Discussed and intentionally deferred indefinitely. Captured here so we don't re-debate them.

When picking up a tier-A or tier-B item, claim it in BRAIN.md so two sessions don't collide.

---

## Tier A — Must fix before next launch

These items block real customer impact. Touch them first.

### A1 · Rotate `HUB_INBOUND_SECRET` (Cloudflare email worker)

**State.** `cloudflare-hub-email-worker.js` has a hardcoded `HUB_INBOUND_SECRET` value committed to the public ConstructIInv repo. Known security exposure.

**Action.** Generate new secret, set as Railway env var, update worker to read from env, deploy worker, rotate the value in any pinned references, audit git history for prior values.

**Blocker before next change to that worker.** Any commit touching `cloudflare-hub-email-worker.js` must include the rotation in the same PR.

**Source.** Lesson 16 implicit / OPS-15; live security exposure tracked in userMemories.

### A2 · Verify Stripe gate behavior on "Send to Owner" (Bug D)

**State `[NEEDS VERIFICATION]`.** After May 6, 2026 git recovery operations, it's uncertain whether Bug D's fix (Stripe gate on email send for contractors who haven't completed Connect onboarding) is fully deployed to production. The fix was committed; the deploy verification was disrupted by the same session that caused the recovery.

**Action.** Production smoke test — log in as a contractor without Stripe onboarding complete, attempt "Send to Owner" on a pay app, confirm the gate modal appears with the correct copy. If broken, diagnose and re-ship.

**Source.** ConstructIInv operational notes; userMemories.

### A3 · Pay App PDF degraded to PDFKit fallback

**State.** Production is currently serving the 215-line plain PDF formatter instead of the 443-line rich Puppeteer-rendered output. Customers see usable-but-ugly PDFs.

**Action.** Wire the rich formatter that was committed in the May 6–7 recovery session. Verify Chromium availability on Railway (Lesson 12 — the puppeteer regression that caused this in the first place). Layer 9 verification: download a generated PDF, compare visually to the rich design, commit the screenshot.

**Source.** ConstructIInv operational notes.

---

## Tier B — Active build queue

These are designed, decided, and ready to ship. Pick up in the order listed unless a dependency says otherwise.

### B1 · Vendor dashboard backend (uncommitted)

**State.** Backend code exists as uncommitted local files. Frontend assumes the routes work. Production has none of it.

**Action.** Audit the uncommitted files (likely in a Cowork sandbox or local working tree). Commit cleanly via Git Data API (OPS-12). Verify routes mount. Run Layer 9 on vendor dashboard load.

**Source.** Lesson 1 / Lesson 18 (working code is usually already there).

### B2 · Reject/resubmit/version-thread frontend UI

**State.** Backend is complete. The endpoints work — `POST /api/hub-review/uploads/:id/reject`, `POST /api/vendor/uploads/:id/resubmit`, the `parent_upload_id` thread, the `tm_audit_events` integration. Frontend is missing.

**Action.** Build `ContractorReviewSlideOver.tsx`, `VendorResubmitBanner.tsx`, `DocumentVersionThread.tsx` per the vendor-sub-portal design doc v3. Mount in Project Hub. Layer 9 verification: full reject → resubmit → approve cycle with screenshots.

**Source.** vendor-sub-portal-design-doc-v3.md.

### B3 · V1 trust score orphan cleanup

**State.** `server/features/trust/` is orphan dead code. References a dropped column → returns 500 on every call. The V2 trust score (`server/features/trust-v2/`) is the canonical implementation; the V1 directory should be removed.

**Action.** Confirm no live routes mount from V1. Delete the directory. Verify no imports remain. Commit.

**Source.** userMemories ConstructIInv known debt; ADR-21 implicit.

### B4 · Per-project role derivation refactor

**State.** ConstructIInv currently uses `users.user_role` (per-user flag) as a navigation hint. ADR-20 commits to migrating to relational role derivation (read role from project membership for every action). The `users.user_role` column stays — but new code paths should derive roles relationally.

**Action.** Audit which routes use `users.user_role` authoritatively (not just as a nav hint). Refactor each to use relationship columns (`contractor_user_id`, `vendor_user_id`). New routes already follow this pattern.

**Source.** ADR-8, ADR-20.

---

## Tier C — Designed but not built

Locked decisions exist. A Cowork session could pick these up tomorrow with no further design work.

### C1 · ConstructIInv consumes `@varshyl/team-management@v0.1.0`

**State.** Team Management module is production-grade and live in toolkit. ConstructIInv hasn't integrated yet because the product team is finishing other bug fixes.

**Action.** When ConstructIInv bug-fix work is complete: separate Cowork session in `construction-ai-billing` repo. Install module, write adapter (~30 lines), mount router, run migrations, Layer 9 verification.

**Dependency.** ConstructIInv's current bug-fix cycle complete (status: in progress per Vagish, May 10, 2026).

**Source.** Toolkit Phase 1 success criterion #2 (`SHARED_MODULE_ARCHITECTURE.md` §6.1).

### C2 · BrandOS consumes `@varshyl/team-management@v0.1.0`

**State.** Toolkit's Phase 1 success criteria require a SECOND consumer within 60 days of v1.0.0. BrandOS is the natural fit — solo creators are an org-of-one, agencies are an org-of-many.

**Action.** Cowork session in BrandOS repo. Install + adapter + mount + verify.

**Dependency.** C1 lands first (so we learn from the first integration). BrandOS in a state ready to integrate (`[NEEDS VERIFICATION]` — is BrandOS deployed and stable?).

**Source.** Toolkit Phase 1 success criterion #3.

### C3 · Multi-state lien expansion (Texas, Florida, Nevada)

**State.** California lien module is the canonical implementation. State-aware architecture exists. Adding a new state = adding one rule file (`server/features/aria/lien/<state>.js`) + registering it in the state router.

**Action.** Three Cowork sessions, one per state. Each session: research state lien law deadlines and notice requirements, draft the rule file, add to router, write tests, ship.

**Source.** ConstructIInv Bible §8 (Layer 6 lien intelligence).

### C4 · Module pattern reference docs (`varshyl-toolkit/RUNBOOK.md`)

**State.** Toolkit has `SHARED_MODULE_ARCHITECTURE.md` (architecture) and per-module READMEs (usage). Missing: an operational runbook covering "how to add a module," "how to do a major version bump," "how to debug a failed Railway deploy," "how to publish a release."

**Action.** Draft `RUNBOOK.md` in the toolkit. Cross-reference with `OPS_RULES.md`.

**Source.** Documentation foundation strategy (May 10, 2026).

---

## Tier D — Needs design before build

Idea is clear, scope feels right, but specific decisions aren't resolved. Each item needs a design-chat session before a Cowork session.

### D1 · `@varshyl/stripe-subscriptions` module (toolkit's second module)

**State.** First Varshyl product to consume it: Daily Log AI ($25/month, web-based payments via Stripe; iOS uses Apple IAP and Android uses Google Play Billing — those are out of scope for this module).

**Locked context** (carried forward from May 10, 2026 Bible & Research chat):
- Module name: `@varshyl/stripe-subscriptions`
- Type: subscription only. No marketplace, no Connect, no `application_fee`. The simplest Stripe mode.
- Pricing: flat monthly subscription per Stripe Product. v0.1.0 supports a single price; multiple tiers deferred to v0.2.0.
- **Override module (must be in v0.1.0):** admin can grant free access (indefinite), percentage discounts, time-limited free periods, or 100% discount. Override system ON by default, admin UI behind `enableOverrides` feature flag (default true).
- Connection to Team Management: subscription is per ORG, not per user. Org owner pays. Members get access through their org's subscription. Stripe Subscriptions depends on `@varshyl/team-management` being installed first.
- Stripe account: existing Varshyl Inc. account. Daily Log AI gets its own Stripe **Product** within that account so revenue tracks separately. New Stripe Product = internal grouping, not new account.
- API access: restricted API key, scoped to subscription/customer/payment operations. Cowork generates this via Stripe API once authorized.
- Webhooks: separate endpoint per product (`/api/stripe/webhook`) with idempotency.
- Customer portal: Stripe-hosted (Stripe Customer Portal). Not custom-built.

**Design decisions still to lock** (~8–10 questions, walked one at a time in design chat):
1. Trial handling — free trial duration? Required card on signup or not?
2. Payment method storage and update flow — Stripe Customer Portal handles it, or custom?
3. Webhook event coverage — minimum set vs. full set
4. Failed payment / dunning policy — how many retries, what cadence, what cancellation trigger
5. Cancellation flow — immediate vs. end-of-period; refunds policy
6. Tax handling — Stripe Tax on or off in v0.1.0
7. Refunds — self-service or admin-only
8. Override audit rules — what gets logged, who sees it
9. Pause/resume subscriptions — supported or deferred
10. Multi-product future-proofing — can one org subscribe to multiple Varshyl products through one Stripe Customer?

**Action.**
1. Open dedicated design chat ("Stripe Subscriptions Design") and walk the 10 questions.
2. Output design doc + Cowork build prompt.
3. Cowork session: ship `stripe-subscriptions@v0.1.0` to toolkit.
4. Daily Log AI integrates.

**Source.** May 10, 2026 Bible & Research chat (this chat).

### D2 · Team Management Module v0.2.0 — Shared Access

**State.** Decision 1 in Team Management v0.1.0 scaffolded `tm_shared_access` as an empty table to reserve the space. v0.2.0 fills it in.

**Use case.** External parties (CPAs, consultants, contractors) need time-limited scoped access to an org's data without becoming members of that org. They use their own user account in their own org and "borrow" access.

**Design decisions to lock:**
- What resource scopes can be granted? (Whole org, specific projects, specific report types)
- How long can grants last? (Always time-limited, or indefinite-with-revoke option)
- Who can grant access? (Owner only, Admin+, both)
- Notification model — does the grantor's org get notified when the grantee accesses data?
- Revocation flow — immediate vs. graceful
- Audit log integration — visible to whom

**Action.** Design chat → Cowork build session → toolkit v0.2.0 of team-management.

**Source.** Team Management Decision 1 carve-out (May 8, 2026).

### D3 · Multi-tier subscriptions in Stripe Subscriptions module

**State.** v0.1.0 ships single-price-per-product. v0.2.0 supports multiple tiers (e.g., Starter $25 / Pro $75 / Enterprise custom).

**Design decisions to lock:**
- Tier model — multiple Stripe Prices on one Product, or multiple Products?
- Upgrade/downgrade flow — immediate proration, end-of-period, or both?
- Tier-specific feature flags — does the module emit "what tier is this user on?" to the host product?
- Annual billing — flat percent discount, custom Stripe Coupon, or full pricing system?

**Source.** Implicit follow-on to D1.

### D4 · Notifications toolkit module (`@varshyl/notifications`)

**State.** Every product needs in-app notifications (bell icon, unread count, notification center, mark-as-read). Currently each product builds it from scratch. Natural toolkit module.

**Design decisions to lock:**
- Storage model — JSON in DB, or separate event sourcing?
- Real-time delivery — polling vs. WebSocket vs. Server-Sent Events
- Channel support — in-app only in v0.1.0, or also email digest, push notifications, SMS?
- User preferences — global on/off, or per-notification-type granularity?
- Cross-module event ingestion — Team Management writes "invite_received" events; how does the notifications module pick them up?

**Action.** After Stripe Subscriptions ships (D1) and we've learned more from the second integration.

**Source.** Mentioned as toolkit second-module candidate in May 10 Bible chat.

### D5 · File storage toolkit module (`@varshyl/file-storage`)

**State.** Uploads, S3, presigned URLs, virus scan, type validation. Currently scattered across products. Strong candidate for extraction.

**Design decisions to lock:**
- Storage backend — S3, R2 (Cloudflare), or pluggable?
- Multipart upload support — required for files > 100MB
- Virus scanning — synchronous (blocking) vs. asynchronous queue
- Metadata model — minimum required, host-product extensible
- Lifecycle policies — auto-delete after N days, archival to cold storage, etc.

**Source.** Toolkit second-module candidate; not yet committed.

### D6 · Audit log toolkit module (cross-product) (`@varshyl/audit-log`)

**State.** Separate from Team Management's internal audit log. A general-purpose "log any action" module products use for their own audits (e.g., ConstructIInv could log "pay app approved," "invoice rejected," etc.).

**Source.** Toolkit candidate from May 10 Bible chat.

### D7 · Feature flags toolkit module (`@varshyl/feature-flags`)

**State.** Admin UI for toggling features per environment, per org, per user. Currently each product hardcodes flags.

**Source.** Toolkit candidate from May 10 Bible chat.

---

## Tier E — Wish-list (no immediate trigger)

These are useful but nothing blocks them and nothing's waiting on them. Picked up when capacity allows or when a related item makes them necessary.

### E1 · Insurance expiry tracking from uploaded certs
Vendors upload insurance certificates with expiration dates. Cron reminders at 60/30/7 days. Penalty to trust score on expiry. ConstructIInv-specific.

### E2 · ARIA Layer 9 — accounting sync intelligence
Cross-reference QuickBooks / Sage data with ConstructIInv to surface anomalies (vendor billed but no QB invoice, payment received but no QB record, etc.).

### E3 · Sage integration
Requires Sage Developer Partner account ($2,500/yr) before code starts. Adapter pattern (`sage.adapter.js`) with separate drivers for Sage CM (REST) and Sage Intacct (REST + SOOAP). Direction: Sage → ConstructIInv (projects, vendors, job codes), ConstructIInv → Sage (pay apps, payments, change orders).

### E4 · AI testing agents (Sam/Mike/Paul as automated Playwright tests)
The "Sam/Mike/Paul" test personas have been discussed across multiple sessions but not built. They'd be automated user-flow Playwright agents simulating real customer behavior.

### E5 · Hub reporting module — analytics, rejection breakdown, PDF/CSV export
Per-project hub analytics: rejection reason pie charts, trust score history line charts, document submission timelines. PDF + CSV export. Included in project close-out ZIP.

### E6 · ZIP close-out automation
Trigger: all SOV lines 100% billed AND unconditional lien received from all trades. Auto-generates project close-out summary PDF. ZIP all Hub docs + pay apps + lien waivers + summary + Hub report. GC and sub notifications.

### E7 · Certified mail via Lob.com integration
$11.99 (standard) / $14.99 (rush) per piece. Button in lien alert card. Generates the prelim notice (already automatic), then offers one-click certified mail send.

### E8 · Stripe Subscriptions module — pause/resume support
Customer can pause subscription for N days/weeks (vacation, slow season). Stripe supports this natively.

### E9 · Stripe Subscriptions module — usage-based / metered billing
For products where customers pay per-something (per API call, per project, per upload). Different from flat subscription. Probably a separate module rather than an extension.

### E10 · Voice integration (ARIA chat → voice on mobile)
Microphone button in ARIA chat. Speech-to-text input, text-to-speech response. Not SOREN (which is field-first); this is just voice on the existing chat.

---

## V4 — Long-horizon commitments

Scoped out of v3 (ConstructIInv) but locked as commitments for v4. Tracked here so they don't get lost. Each is its own future major work stream.

### V4-1 · SOREN — voice-first field assistant overlay

**Scope.** Voice for intent, touch for confirmation, show-don't-search for ambiguous fields. Sits on top of the v3 API surface, zero backend changes.

**Example interaction.** Worker on a job site, hands dirty, says: "Mark today's daily log for 123 Elm Street complete, 4 workers, weather sunny." SOREN parses, shows a confirmation card, worker taps confirm.

**Dependencies.** v3 launch complete and stable. Voice infrastructure decisions (Whisper API? OpenAI Realtime API? local Vosk? — to be designed in a dedicated SOREN design chat post-v3).

**Source.** ADR-19; userMemories.

### V4-2 · Team Management v0.2.0 — Shared Access (formal)

**Scope.** Detailed in D2 above. Promoted to V4 because it'll likely ship after the first real product integration teaches us how Shared Access should work in practice.

### V4-3 · Per-project role derivation refactor (full)

**Scope.** Eliminate `users.user_role` dependency from all production code paths. Roles derived entirely from project membership relationships. Schema migration to remove the column if/when zero code paths reference it.

**Source.** ADR-20.

### V4-4 · Mobile app for field personnel

**Scope.** Native iOS / Android app (or PWA — to be designed). Field-first UX. Photo capture, voice notes, daily log entry. Connects to existing ConstructIInv backend.

**Note on payment system:** per May 10, 2026 decision, mobile apps use Apple IAP and Google Play Billing for any in-app subscriptions, not Stripe. Stripe only for web payments.

### V4-5 · Enterprise / Master Account product tier

**Scope.** Custom tier for franchisees and multi-location operators. Parent account that "owns" multiple child orgs. Parent dashboard sees rollups. Each child org is still a normal org under the hood. Custom pricing (sales motion, not self-serve).

**Trigger.** First willing customer.

**Source.** May 10, 2026 Bible chat — Decision 1 Enterprise umbrella carve-out.

---

## Parked

Items intentionally deferred indefinitely. Captured here so we don't re-debate them.

### P1 · Multi-org-per-user model (Team Management Option B)

**Discussed.** May 10, 2026 (Team Management design chat).

**Decision.** Stick with one-user-one-org. Vendor-multi-contractor case is handled by existing vendor invites (separate flow). Edge cases (accountants, multi-company owners) handled by Shared Access (Team Management v0.2.0). Enterprise case handled by V4-5.

**Re-debate trigger.** Only if a customer with a genuine multi-employer-per-user need pays for a different model. Theoretical future demand is not a trigger.

### P2 · Co-owners in Team Management (Decision 7 Option C)

**Discussed.** May 10, 2026.

**Decision.** Single Owner per org. Multiple-Owner pattern creates billing confusion, permission deadlocks, and audit ambiguity. Most products that tried it (early Slack, early Linear) walked it back to single-owner-with-transfer.

**Re-debate trigger.** None anticipated.

### P3 · Super-admin impersonation ("log in as user")

**Discussed.** May 10, 2026 (Team Management Decision 8).

**Decision.** Super-admin can never act as another user. Protects against insider threat and legal exposure. Lockout recovery handled through password reset + ownership appointment flows instead.

**Re-debate trigger.** Only if a regulatory requirement (e.g., HIPAA) explicitly demands it, in which case the requirement defines the implementation.

### P4 · Custom roles per product (Team Management Decision 2 Option C)

**Discussed.** May 10, 2026.

**Decision.** All products use the four canonical roles (owner / admin / member / viewer). Custom roles per product would force every consuming product to design their own permission system, fragment audit logs, and prevent the toolkit from enforcing common rules.

**Re-debate trigger.** None.

---

## Maintenance

When an item ships, move it to a "Shipped" section at the bottom of this file (or delete it if trivially small). Keep `BACKLOG.md` clean — it should always represent what's actually coming next, not historical archaeology. The git history holds the archaeology.

When a new item emerges, add it to the right tier with a one-line state + one-line action. Long discussions live in design chats, not here.

---

## Shipped

*(Empty as of May 10, 2026. Items will move here as they complete.)*

---

*End of BACKLOG.md. Next document in queue: `MODULES.md`.*
