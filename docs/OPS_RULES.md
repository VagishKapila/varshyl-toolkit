# OPS_RULES.md

> **Role in the doc set:** Process discipline. The non-negotiable rules every Cowork session, every Claude session, and every Vagish-driven action must follow. Reading this file means agreeing to them.
>
> **Relationship to `LESSONS.md`.** Lessons are descriptive — what happened, what pattern emerged. Rules are prescriptive — what you must do. Each rule traces back to one or more lessons. If a rule conflicts with a lesson, fix the rule.
>
> **Citation format.** When a Cowork prompt or PR violates a rule, refer to it by number — `OPS-7` is faster than describing the rule.
>
> **Last updated:** May 10, 2026.

---

## How rules are organized

Four sections:
- **Process discipline** — how work flows between Vagish, Claude, and Cowork
- **Code & commit discipline** — how code lands in the repo and gets to production
- **Verification discipline** — how we know something actually works
- **Documentation discipline** — how knowledge is captured and stays current

Within each section, rules are numbered sequentially. The numbering is canonical — `OPS-1` is `OPS-1` forever, even if the rule above it gets edited.

---

## Process discipline

### OPS-1 · Vagish never runs CLI

Every action — git, npm, railway, psql, anything — happens via GitHub API + Railway API + Stripe API through Cowork, or via the Claude.ai chat interface. Cowork reports framed as "Vagish needs to run X" are violations unless there's a specific surfaced BLOCKER. Almost all "blockers" are API-resolvable: env var changes go through Railway dashboard once, OAuth callbacks are one-time browser clicks, platform-creation limits (Lesson 22) get worked around. Cowork defaults to "I'll do it" and escalates only when a Vagish dashboard click is genuinely required.

*Source: Lesson 22 (GitHub org-creation API gap); operational practice across every session.*

### OPS-2 · One concern per Cowork prompt

Each Cowork session ships exactly one PR. Bundling Bug A + Bug B + Bug C into one prompt produces inconsistent results — Cowork executes the first instruction and skips or hallucinates the rest (Lesson 10). If a prompt feels long because it has multiple steps inside one concern (e.g., "build feature X" with 7 milestones), that's fine — it's still one concern. If it has multiple concerns (e.g., "build feature X *and* fix bug Y *and* refactor Z"), split into sequenced prompts with halt-and-report between each.

*Source: Lesson 10 (single-fenced prompts), Lesson 7 (atomic commits + halt-on-error).*

### OPS-3 · Diagnostic prompt before every fix prompt

Read-only audit before any code change. Three steps: (1) confirm the bug, (2) trace the root cause to a specific file/line, (3) write the fix only after both are answered. Skipping any step is how 30 async-crash vulnerabilities sat in production for weeks (Lesson 8). The diagnostic prompt explicitly forbids commits — every diagnostic ends with "DO NOT FIX. Vagish decides remediation." Once Vagish decides, a separate fix prompt does the work.

*Source: Lesson 8 (diagnostic-then-fix-then-verify).*

### OPS-4 · Halt on error between bugs

After every fix is verified live, **stop**. Do not start the next fix in the same session unless the verification has already passed. The rollback radius for a bundled commit is too large (Lesson 7). Atomic commits + halt-on-error is the only safe cadence.

*Source: Lesson 7 (atomic commits + halt-on-error between bugs).*

### OPS-5 · Single-fenced prompts to Cowork

One fenced code block per prompt, no "and also" clauses, no implicit context. Cowork is a constrained executor — anything outside the fence is best-effort and frequently lost. If the prompt has multiple steps inside one concern, number them inside the fence. If those steps span multiple concerns, split the prompt (OPS-2).

*Source: Lesson 10 (single-fenced prompts to Cowork).*

### OPS-6 · BrainSync at the end of every session

No exceptions. Every session ends by updating `BRAIN.md` (working memory) with what happened, what was decided, and what's next. If a lesson emerged, it gets added to `LESSONS.md`. If a decision was made, it goes in `DECISIONS.md`. If a lesson promoted to a rule, this file gets updated. Sessions that end without BrainSync silently lose context.

The BrainSync trigger lives in the master start prompt for every product, so it fires automatically without depending on Vagish's memory.

*Source: Lesson 17 (user memory of working flows is authoritative — when memory fails, the docs must hold the truth).*

### OPS-7 · Vagish's memory wins ties

When grep, forensic, or chat history says one thing and Vagish says another, treat Vagish's memory as the primary source until proven otherwise. Working code may live on a branch, in an uncommitted working tree, or in a Cowork sandbox that the current forensic doesn't see. The May 7 forensic that confirmed the magic-link flow was working all along — exactly as Vagish remembered — is the canonical example.

*Source: Lesson 17 (user memory of working flows is more authoritative than grep when there's a conflict).*

### OPS-8 · Check uncommitted work before declaring features missing

Before any "this is broken on production" or "we need to build X" prompt, check uncommitted work first. `git status` on the dev tree. Search frontend `fetch()` URLs against actually-mounted server routes. A 404 from a handler that exists in the working tree means commit-and-ship, not rewrite. PR 2A (May 7, 2026) shipped a parallel address book because OPS-8 was skipped — don't repeat it.

*Source: Lesson 1 (working code is usually already there) and Lesson 18 (check uncommitted work before declaring features missing).*

### OPS-9 · Forensic-and-fix iteration is expected for first releases

When shipping the first real version of a meaty module (v0.1.0 of anything substantial), budget for ~1.5x the "happy path" estimate. CI will fail. Tests will surface schema drift. ESLint config strictness will catch dead code. Vitest setup will need adjustment. Migration ordering will reveal partial-index conflicts. This is the system working, not a sign of failure. Don't conclude something is wrong when CI fails 6+ times on a substantial PR — that's the iteration loop that produces correct production code.

The trigger to stop and reconsider isn't "CI failed again," it's "CI is failing for the same root cause it failed for two cycles ago." Same root cause twice = there's a deeper bug being patched around.

*Source: Lesson 26 (forensic-and-fix cycles are normal for a first release).*

### OPS-10 · Chat split discipline

Bible & Research chats (project docs, archaeology, decisions, lessons) and Code & Ops chats (Cowork prompts, live forensics, deploys) are kept separate per product. Mixing them produces context contamination — the Bible chat starts running Cowork prompts and loses doc focus; the Code & Ops chat starts editing the Bible and loses execution focus.

**Exception that has applied today:** when a brand-new product (toolkit) is being designed AND built simultaneously with no prior Bible to inherit from, one chat can serve both functions until the product has its own Bible. Once the toolkit has its `docs/BIBLE.md` committed, future toolkit work splits along OPS-10.

*Source: Operational practice; userMemories Construct14 chat-split rule.*

---

## Code & commit discipline

### OPS-11 · Atomic commits, one logical change each

One commit per logical chunk. Bug A and Bug B are two commits. Schema migration and route handler are two commits if they're independently meaningful, one commit if they have to ship together to avoid breaking production. The test: if you'd want to revert one without the other, they're two commits.

*Source: Lesson 7 (atomic commits + halt-on-error between bugs).*

### OPS-12 · Multi-file atomic commits use the GitHub Git Data API

When two or three files have to ship together (and there's no good reason to split them), do not `git commit -a` from a working tree. Use the Git Data API with `base_tree=HEAD's tree`:
1. GET current commit SHA → tree SHA
2. POST blobs for each changed file → returns blob SHAs
3. POST a tree with `base_tree=<HEAD's tree>` and only the changed entries
4. POST a commit referencing the new tree
5. PATCH the branch ref to the new commit

This guarantees only the intended files land. Working-tree-based commits sweep up stray uncommitted files (Lesson 15). Bug D, the PDF puppeteer fix, and the v0.1.0 lint-batch fix all shipped clean only because OPS-12 was followed.

*Source: Lesson 15 (atomic multi-file commits use Git Data API with `base_tree=HEAD`).*

### OPS-13 · Lockfile is always committed, never gitignored

`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` — whichever the project uses, the lockfile is a first-class repo artifact. Every `package.json` change ships with a regenerated lockfile in the same atomic commit. New repo audit: `grep -i "lock" .gitignore` must return empty for the lockfile pattern. If it doesn't, that's the first commit.

CI workflows that use `--frozen-lockfile` enforce this implicitly; CI workflows that don't, should be updated to.

*Source: Lesson 12 (adding a package without regenerating lockfile breaks deterministic builds) and Lesson 16 (lockfile must always be committed).*

### OPS-14 · Migrations are always `IF NOT EXISTS`

Every `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX` uses `IF NOT EXISTS` (or its column equivalent — `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). Re-running the boot script must be idempotent — running the same migration twice across staging/prod must be safe. Reject any migration that doesn't follow this.

Migrations are also forward-only. No `DROP`. No rename. If a column needs to be removed, deprecate it (stop writing) for one release, then remove it in a major bump with explicit migration steps in the CHANGELOG.

*Source: Lesson 9 (all migrations `IF NOT EXISTS`).*

### OPS-15 · No hardcoded secrets

Every secret in env vars only. `sk_live_*`, `whsec_*`, `SENTRY_DSN`, `RESEND_API_KEY`, `JWT_SECRET`, `VENDOR_INVITE_ENCRYPTION_KEY`, `HUB_INBOUND_SECRET`, `TM_ENCRYPTION_KEY`, `STRIPE_SECRET_KEY` — all in Railway env vars (or equivalent), never in code, never in committed config files, never in chat outputs that get pasted into commits.

The `cloudflare-hub-email-worker.js` currently has a hardcoded `HUB_INBOUND_SECRET` — known violation tracked in `BACKLOG.md`, must be rotated before any other change to that worker.

*Source: Lesson 16 implicit (lockfile rule generalizes to all artifacts); operational practice.*

### OPS-16 · No "GC" in user-visible strings

UI copy uses Contractor, Vendor, Sub, Trade, or Owner. The string "GC" (or "G.C.", "general contractor") never appears in product UI, marketing copy, emails, or PDFs. Pre-merge grep on every PR:
```
grep -in "\bGC\b\|general contractor" $(git diff --name-only main..HEAD -- '*.tsx' '*.ts' '*.html' '*.md')
```
Hits in non-test files block the merge.

*Source: ADR-13, ADR-15 (terminology lock).*

### OPS-17 · Database column names describe relationships, never absolute identities

Columns use `contractor_user_id`, `vendor_user_id`, `owner_user_id` — names that describe the relationship of the user to the row. Never `gc_user_id`, `sub_user_id`, or any name that asserts a fixed identity.

This rule survives UI terminology pivots. UI copy changes are independent of schema column renames; column renames require a full ADR and major version bump on whatever module owns them.

*Source: ADR-8, ADR-13 (relational role model).*

### OPS-18 · Bible §2.2 review on every infra-touching commit

For ConstructIInv, any commit that touches `Dockerfile`, `railway.toml`, `railway.json`, `nixpacks.toml`, `.dockerignore`, or related infrastructure files requires explicit Bible §2.2 review before merge. Add `[x] Bible §2.2 reviewed` to the commit message.

Nixpacks is banned in ConstructIInv (Lesson 11). For other products (toolkit, future), nixpacks with explicit `dockerfilePath` is acceptable when verified in build logs (ADR-24).

*Source: Lesson 11 (Dockerfile canonical, nixpacks banned); ADR-16 (Dockerfile only for ConstructIInv); ADR-24 (toolkit nuance).*

### OPS-19 · Verify Railway uses Dockerfile on every new service

Regardless of how the builder field is configured, every new Railway service deploy must be verified to actually use the Dockerfile (not nixpacks auto-detection). Check build logs for the line confirming Dockerfile usage. Add `[x] Dockerfile build verified in logs` to any commit that touches Railway service config.

This rule exists because Railway's builder field can say one thing and the actual builder can do another (Lesson 23). The verification step closes the gap.

*Source: Lesson 23 (Railway three-layer config must agree).*

### OPS-20 · Use explicit env var values, not Railway template references

When wiring a service to another Railway service's resource (Postgres add-on, Redis, etc.), set the consuming env var to the explicit value, not a template reference like `${{Postgres.DATABASE_URL}}`. Template substitution is unreliable at runtime (Lesson 24). Capture the resolved internal URL at resource creation time and paste it directly into the consuming service's variables.

*Source: Lesson 24 (Railway template variable substitution is unreliable).*

### OPS-21 · Build duration is a diagnostic signal

When a Railway deploy fails, check build duration BEFORE reading logs:
- **<30s** = pre-build rejection (TypeScript error, npm config error, missing file referenced in source)
- **30–90s** = npm install failure (registry, network, package resolution)
- **90s+** = actual Docker build phase (Chromium download, Vite compile, layer caching)

Use the duration to pick the right hypothesis before grepping logs. Saves diagnosis time.

*Source: Lesson 14 (build duration is a strong diagnostic signal).*

---

## Verification discipline

### OPS-22 · Layer 9 means real headless browser + committed screenshots

"Tests pass" means a real headless browser (Playwright preferred) loaded the live URL of the deployed environment, executed the user flow, and the captured screenshot is committed to `qa-evidence/<feature-name>-<date>/` in the repo. HTTP smoke tests, JWT validation, "TypeScript compiles," and unit tests don't count as Layer 9 — they're earlier QA layers.

No "tests pass" claim is acceptable without committed screenshot files. CI status checks that test against ephemeral environments count for unit/integration but not for Layer 9.

*Source: Operational practice; userMemories Cowork discipline.*

### OPS-23 · No fabricated PASS reports

If Cowork or any other agent reports "12/12 PASS" without committed file evidence, the claim is rejected. Demand verification — re-run the test with output captured, commit the output to the repo, then re-evaluate.

The pattern that triggers this rule: Cowork reports a clean success at a milestone, but the qa-evidence/ folder has nothing new in it from this session. That's the smell. Demand the screenshots.

*Source: Operational practice; ties to OPS-22.*

### OPS-24 · Git push ≠ deployed

After every commit-push, verify the deploy actually replaced the running code before assuming the fix is live. Methods: hit a fingerprint endpoint, compare `git log` on Railway vs. GitHub, scrape a known-changed string from a downloaded asset, or read Railway's deploy state via API.

The deploy may have failed silently. The build may have used a cached layer that didn't include the latest commit. The service may not have restarted. None of these are exotic — they happen. Verification is one extra check that catches them.

*Source: Lesson 3 (GitHub branch identity ≠ deployed code identity).*

### OPS-25 · ConstructIInv 7-layer QA must be green before merge to main

For the ConstructIInv repo specifically, all 7 QA layers must be green before any merge to `main`:

1. `node tests/arch/arch-sanity.js` — verifies formulas in live route files
2. `node qa_test.js` — 194+ static pattern checks
3. `node tests/mutation/mutation-watchdog.js` — confirms QA catches broken formulas
4. `cd client && npx tsc --noEmit` — TypeScript clean
5. `cd client && npm run build` — Vite build succeeds
6. `npx playwright test tests/unit/` — 13 G702 math tests
7. `TEST_BASE_URL=https://construction-ai-billing-staging.up.railway.app npx playwright test tests/e2e/`

If any layer fails, stop, fix, run all 7 again from Layer 1. Never skip forward.

Other Varshyl products may have different QA layers; whatever they are, the rule is the same — all of them green before merge.

*Source: ConstructIInv Bible §15.1; operational practice.*

---

## Documentation discipline

### OPS-26 · Documentation lives in Git, in the repo it describes

Docs live in `<repo>/docs/`. Not in Notion. Not in Google Drive. Not in a chat. Not on Vagish's laptop. The chat is for drafting; the committed doc in Git is canonical.

The toolkit (`varshyl-toolkit`) is the home for cross-product documentation. Each product repo owns its product-specific docs. The `docs/BIBLE.md` router doc in each repo points at the others.

When a doc needs to be shared with a collaborator or future hire: share the repo URL. They read `CLAUDE.md` at the root, which points at `docs/`, which points at the Bible router. No external knowledge transfer needed.

*Source: Architecture decision (May 10, 2026); operational practice.*

### OPS-27 · Feature PRs touch docs

Every PR that ships behavior changes must include doc updates in the same PR:

- New feature → update `MODULES.md` with what was built
- New decision → add an ADR to `DECISIONS.md`
- Lesson learned during the PR → add to `LESSONS.md`
- Production state changed → update `PRODUCTION_STATE.md`
- Module released → update its `CHANGELOG.md`

Enforcement mechanism (target state — to be built): a GitHub Action warns (not blocks) when a feature PR doesn't touch `docs/`. Sometimes a feature genuinely doesn't need a doc update — the warning is a forcing function, not a hard rule. You have to consciously decide to skip docs, not unconsciously forget.

*Source: Documentation strategy (May 10, 2026).*

### OPS-28 · Monthly doc audit

First Monday of every month, ~30 minutes. Open this chat (or a fresh "Doc Audit" chat). Tell Claude: "Run a doc audit on the toolkit and each product. What's stale? What's missing? What lessons emerged in the last 30 days that aren't captured?"

Claude reads the docs, scans recent commits and chat history, flags drift. Vagish spends 20 minutes fixing. Done for another month.

This catches what BrainSync misses — slow drift, accumulated small omissions, emerging patterns that span sessions.

Calendar reminder lives outside the docs (Google Calendar, phone reminder, whatever Vagish actually checks).

*Source: Documentation strategy (May 10, 2026).*

---

## Reading order for new sessions

When starting a new Cowork session or Claude session for the first time on a product:

1. Read `CLAUDE.md` at the repo root.
2. Read `BRAIN.md` for current working state.
3. Open `docs/BIBLE.md` (the router) to see what other docs exist.
4. Read the docs relevant to the task — most sessions need `OPS_RULES.md` (this file) plus the specific decision/module doc relevant to the work.

When in doubt about a rule, scan the section titles in this file. If a title matches what you're about to do, read the full rule before proceeding.

---

## Reopen log

When reopening a rule, add a row here with date, rule number, and named reason. Don't just edit the rule — append a "Reopened (date): see Reopen log" note inside the rule, and write the new state above. The original stays for archaeology.

*(Empty as of May 10, 2026.)*

---

*End of OPS_RULES.md. Next document in queue: `BACKLOG.md`.*
