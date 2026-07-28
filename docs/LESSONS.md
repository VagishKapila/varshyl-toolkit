# LESSONS.md

> **Role in the doc set:** Compounding intelligence. Every recurring failure mode and every hard-won insight from past sessions, captured as a numbered lesson. Read this before starting any non-trivial work — most "new" bugs are old lessons not yet internalized.
>
> **Source of truth.** This document is the canonical lessons file. Lessons 1–17 originate from BRAIN.md committed at `f464e02` in the construction-ai-billing repo. Lesson 18 was added in the prior Bible & Research chat (May 7–8, 2026). Lessons 19–25 were added in this Bible & Research chat on May 8, 2026, during and after the `varshyl-toolkit` bootstrap.
>
> **Last updated:** May 8, 2026.
>
> **Add new lessons here when:** the same mistake happens twice, or when a single mistake costs more than an hour to recover from.

---

## How lessons are written

Each lesson is a **pattern**, not an incident. The format is: short title → one-line statement of the pattern → 2–4 lines of evidence and prescription. If a future session asks "did I just hit Lesson N?", they should be able to scan the title row and recognize it without reading the whole entry.

Lessons are numbered, not categorized. Rules that come out of lessons live in `OPS_RULES.md` with explicit cross-references.

---

## Lesson 1 — The working code is usually already there. Search before building.

**Pattern.** When a feature seems missing or broken, the implementation is more often dormant than absent. Past parallel-agent runs and refactors leave behind built-but-unwired modules.

**Evidence.** Validated five times across May 5–6, 2026:
- `LienDisclaimerModal.tsx` already on staging — almost rebuilt.
- Auto-create lien hook already designed in `routes/projects.js` — almost wrote a separate cron.
- 443-line rich PDF formatter sat uncommitted in a Cowork sandbox — production was running the 215-line plain version.
- `infra/dockerfile` branch from May 5 already had Path C started — almost wrote the Dockerfile fix from scratch.
- ~2,019 lines of fully-built feature code (`vendor-book/`, `repository/`, `reporting/HubReports`, `early-pay/`, `stripe-onboard/`) sit unmounted on production today.

**Prescription.** Before writing any new code, run `grep -rn "<feature_keyword>"` against the repo, check uncommitted Cowork sandboxes, list every branch. If you find code that does what you need, fix the wiring; don't rebuild.

---

## Lesson 2 — Cowork sandbox has stale worktree problems. Use the Git Data API as fallback.

**Pattern.** When git plumbing in Cowork misbehaves (stale refs, lost commits, ghost branches), force-resetting refs locally doesn't guarantee Railway serves matching code.

**Prescription.** Use the GitHub Contents API (one file at a time) or Git Data API (multi-file atomic commits — see Lesson 15) to read/write files directly. Never trust `git mktree` or `git commit-tree` against a working tree assembly.

---

## Lesson 3 — GitHub branch identity ≠ deployed code identity.

**Pattern.** A successful `git push` does not mean Railway is now serving matching code. Branches, builds, and deploys are three independent states.

**Prescription.** After every commit-push, verify the deploy actually replaced the running code before assuming the fix is live. Methods: hit a fingerprint endpoint, compare `git log` on Railway vs GitHub, scrape a known-changed string from a downloaded asset, or read Railway's deploy state via API.

---

## Lesson 4 — Express 4 doesn't auto-forward async rejections.

**Pattern.** Bare `await` in route handlers without try/catch causes unhandled rejections. A single bad Postgres blip then crashes the process.

**Evidence.** May 6, 2026 audit found 30 vulnerable handlers in production code.

**Prescription.** `express-async-errors` (or its 50-line inline equivalent) fixes the entire class of bugs in one patch. Sunsets when Express upgrades to 5.x. Inline IIFE patch lives in `server/app.js` as of `7f9aae54`.

---

## Lesson 5 — Vite ENOSPC in sandbox is non-fatal.

**Pattern.** Cowork's sessions volume occasionally fills, breaking `npm install` or `vite build` locally. Railway has ample disk.

**Prescription.** If Vite/npm fails the build with `ENOSPC` in Cowork's sandbox, push anyway and let Railway build. For npm install failures, inline the package source directly into the repo if needed (we did this with `express-async-errors` in `7f9aae54`).

---

## Lesson 6 — Frontend hooks expose error state correctly; consumers don't always render it.

**Pattern.** A "silent failure" in the UI is most often a consumer component that didn't destructure `error` from its hook, not a hook that swallowed the error.

**Evidence.** May 6, 2026 audit confirmed 9/10 hooks expose errors correctly. Only `Sidebar.tsx` wasn't rendering them.

**Prescription.** When a feature "fails silently," check the consuming component is destructuring `error` and rendering it. Don't blame the data layer first.

---

## Lesson 7 — Atomic commits + halt-on-error between bugs.

**Pattern.** Bundling Bug A + Bug B + Bug C into one commit makes the rollback radius too large. One bad fix poisons the whole batch.

**Prescription.** One logical change per commit. After every fix, halt and verify before moving to the next bug. Never `git push` two unrelated logical fixes together.

---

## Lesson 8 — Diagnostic-then-fix-then-verify.

**Pattern.** Skipping the read-only audit step is how 30 async-crash vulnerabilities sat in production for weeks. Skipping verification is how "fixed" bugs ship without ever being live.

**Prescription.** Three steps before every fix: (1) confirm the bug, (2) trace the root cause to a specific file/line, (3) write the fix. Then deploy, then verify the deploy actually serves the fix. Skipping any step is a violation.

---

## Lesson 9 — All migrations `IF NOT EXISTS`.

**Pattern.** Every `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX` must use `IF NOT EXISTS` (or its column equivalent). Re-running the boot script must be idempotent.

**Evidence.** May 6, 2026 lien-alert table additions followed this rule; staging and prod converged cleanly. `db.js` boot pattern is the canonical example.

**Prescription.** Reject any migration that isn't idempotent. The risk of running the same migration twice across staging/prod must be zero.

---

## Lesson 10 — Single-fenced prompts to Cowork.

**Pattern.** Cowork is a constrained executor. Long prompts with "and also" clauses produce inconsistent results — Cowork will execute the first instruction and skip or hallucinate the rest.

**Prescription.** One fenced code block per prompt, no "and also" clauses, no implicit context. If a prompt feels long, split it into sequenced prompts with halt-and-report between each.

---

## Lesson 11 — Never violate Bible §2.2. Dockerfile is canonical, nixpacks is BANNED.

**Pattern.** Nixpacks is broken on Node 22 (CXXABI_1.3.15 ABI mismatch). Any commit that flips the Railway builder to nixpacks freezes production.

**Evidence.** May 6, 2026 commit `7f9aae54` silently flipped builders + deleted Dockerfile, freezing prod for 3 hours.

**Prescription.** Dockerfile is the only allowed Railway builder for ConstructIInv. `railway.toml` must specify `builder = "dockerfile"`. Any commit that touches Dockerfile, railway.toml, or nixpacks.toml requires explicit Bible §2.2 review before merge. Add `[x] Bible §2.2 reviewed` to the commit message. (See also Lesson 23 — varshyl-toolkit's nixpacks-with-dockerfilePath pattern is acceptable when verified, but ConstructIInv's full builder=dockerfile rule remains the default.)

---

## Lesson 12 — Adding a package to `package.json` without regenerating `package-lock.json` breaks deterministic builds.

**Pattern.** Without a committed lockfile, every Railway build resolves dependencies fresh. A single bad version anywhere in the transitive tree silently breaks production.

**Evidence.** May 6, 2026 — `7f9aae54` added `puppeteer ^22.0.0` without a lockfile and froze prod for hours.

**Prescription.** Every `package.json` change requires a regenerated `package-lock.json` in the same atomic commit. See Lesson 16 for the deeper rule about gitignore.

---

## Lesson 13 — Search for partial work in branches before starting infra fixes.

**Pattern.** "Working code is usually already there" applies recursively to **branches** as much as to files. A previous session may have started the same fix on a different branch.

**Evidence.** May 6, 2026 — `infra/dockerfile` branch from May 5 already had two commits doing Path C. We were about to write it from scratch.

**Prescription.** Before any infra fix, run `git branch -a | grep -i <feature>` and check for partial work. List branches updated in the last 7 days. Read commit messages on each before starting.

---

## Lesson 14 — Build duration is a strong diagnostic signal.

**Pattern.** Pre-build vs build-time vs post-build failures look similar in the abstract but have very different signatures. Build duration tells you which one.

**Heuristic.**
- **<30s** = pre-build rejection (TypeScript error, npm config error, missing file referenced in source).
- **30–90s** = npm install failure (registry, network, package resolution).
- **90s+** = actual Docker build phase (Chromium download, Vite compile, layer caching).

**Prescription.** When a Railway deploy fails, check build duration FIRST, then read logs with the right hypothesis. Don't grep logs blindly.

---

## Lesson 15 — Atomic multi-file commits use the Git Data API with `base_tree=HEAD`. Never `mktree` on a working tree.

**Pattern.** Working-tree-based commits sweep up stray uncommitted files (untracked source, sandbox artifacts) and produce non-deterministic commits.

**Evidence.** May 6–7, 2026 outage: 5 critical files were on disk but never committed. A working-tree-based commit would have included them randomly. The Bug D fix and PDF fix both shipped clean only because we used the Git Data API with `base_tree=HEAD`.

**Prescription.** For any multi-file atomic commit, use the Git Data API:
1. GET current commit SHA → tree SHA.
2. POST blobs for each changed file → returns blob SHAs.
3. POST a tree with `base_tree=<HEAD's tree>` and only the changed entries.
4. POST a commit referencing the new tree.
5. PATCH the branch ref to the new commit.

This guarantees only the intended files are in the commit. Never `git mktree` on a working tree assembly. Never `git commit -a` for multi-file atomic operations.

---

## Lesson 16 — `package-lock.json` must always be committed. Never `.gitignore` it.

**Pattern.** A gitignored lockfile means every build is non-deterministic. Same root cause as Lesson 12, stated as a rule for the repo.

**Evidence.** May 6–7, 2026 PDF regression: `package-lock.json` had been gitignored since the repo was created. `7f9aae54` added puppeteer without a lockfile and prod silently lost Chromium across builds.

**Prescription.** `package-lock.json` is a first-class repo artifact. It belongs in git. The `.gitignore` rule that excludes it is itself a bug. Audit every repo for this — it's a one-line check (`grep -i "lock" .gitignore`) that prevents an entire failure class.

---

## Lesson 17 — User memory of working flows is more authoritative than grep when there's a conflict.

**Pattern.** When Vagish says "this worked yesterday" and the forensic says "it never existed," the user is often right and grep is missing context — the working version was on a different branch, in a Cowork sandbox, or built by an earlier session that's been refactored away.

**Evidence.** May 2, 2026 Bible terminology fix (Contractor not GC) was missed in v3 design doc, caught by Vagish at PR 1 finalize. May 6–7, 2026 — multiple times Vagish's recall was right when forensic returned empty. Cowork forensic reports were wrong-scoped multiple times — answered questions Vagish didn't ask. May 7, 2026 archaeology forensic confirmed the magic-link vendor flow has been live on production end-to-end exactly as Vagish remembered, despite a PR 2A forensic earlier the same day that pointed at the wrong code path and reported "broken."

**Prescription.** Before declaring "this never existed" based on a grep result, search past chats first. Ask Vagish to point to a screenshot, a date, or a feature name he remembers. Treat user recall as a primary source, not a secondary one.

---

## Lesson 18 — Check uncommitted work before declaring features missing.

**Pattern.** A 404 from a route handler that exists in the working tree is a missing-mount or missing-commit problem, not a missing-feature problem. Building a parallel implementation when one already exists is the most expensive mistake in this codebase.

**Evidence.** May 7, 2026 — PR 2A shipped a parallel vendor address book backend because a forensic concluded the address book was missing. The original implementation was live and working — the forensic had searched for the wrong route prefix. ~2,019 lines of fully-built feature code currently sit unmounted on production for similar reasons.

**Prescription.** Before any "this is broken on production" or "we need to build X" prompt, check uncommitted work first. `git status` on every dev tree. Search frontend `fetch()` URLs against actually-mounted server routes. A 404 from a handler that exists in the working tree means commit-and-ship, not rewrite. This rule is operationalized as `OPS-8` in `OPS_RULES.md`.

---

## Lesson 19 — Cross-product module interfaces are designed before the first product builds them.

**Pattern.** Reusable modules that span products need their public API designed in the abstract first. Building the first version inside one product, then "opening it up later," produces an API shape that leaks the original product's internals into every future consumer.

**Evidence.** May 8, 2026 — Trust Score, Vendor Invites, and the upcoming Team Management module all share the same architectural shape: small public API, per-product adapter, no cross-product imports. The toolkit (`varshyl-platform` → `varshyl-toolkit`) was designed with this contract first; `team-management@v0.0.1` shipped as a stub demonstrating the contract end-to-end before any real features were built. Trust Score and Vendor Invites stay inline in ConstructIInv until earned in (see `MODULES.md` Phase 2 criteria).

**Prescription.** Any module that is plausibly cross-product — user management, audit log, notifications, file storage, payment glue — gets a design doc before code. The design doc lists: public API, adapter contract, owned tables, events emitted. If a module is genuinely product-specific (Lien Module, ARIA chat), call that out and keep it inline.

---

## Lesson 20 — User management is tenant-facing, not an internal admin tool.

**Pattern.** Treating user management as a Varshyl-only admin tool produces an API shape that ignores the customer's need to manage their own team. Every customer organization needs admin control over their own users — this is a product feature, not a back-office utility.

**Evidence.** May 8, 2026 — Team Management module kickoff. ConstructIInv currently has no organization or tenant concept; every reference is `contractor_user_id`, single-user. Adding tenant-scoped admin later is not a feature add, it's a schema migration touching `users`, `projects`, `pay_apps`, `vendors`, `hub_uploads`, and basically every owned resource. Designing for tenant-scoped admin from day one avoids that migration debt.

**Prescription.** Two layers of admin from the start: tenant admin (each customer org sees only their own users) and Varshyl super-admin (sees across all orgs for support, abuse, legal compliance). Do not build "Varshyl-only" first and "open it up later." Reference: the Team Management kickoff prompt in `BACKLOG.md`.

---

## Lesson 21 — Default to where the existing pattern lives.

**Pattern.** When the user already has months of repos, accounts, or infrastructure under one pattern, the right move is to keep new things in that pattern unless there's a concrete near-term reason to fragment. Theoretical future-migration risk does not beat present-day consistency.

**Evidence.** May 8, 2026 — Bootstrapping `varshyl-toolkit`. I argued for a fresh `varshyl` GitHub org for cleanliness and to avoid future migration cost. Vagish pushed back: every other Varshyl repo lives under `VagishKapila/`, he is the only developer, the org pattern solves a problem he doesn't have. He was right. The toolkit shipped at `VagishKapila/varshyl-toolkit` and the migration cost — if it ever comes — is acceptable. Cost of fragmenting now would have been daily.

**Prescription.** Before introducing a new container (org, account, project, repo namespace), ask: does the user have an existing one that works? If yes, default to it. The argument for fragmentation must be concrete and present-tense, not theoretical and future-tense.

---

## Lesson 22 — GitHub.com has no organization-creation API for personal accounts.

**Pattern.** `POST /admin/organizations` is GitHub Enterprise Server only. The public github.com API does not expose org creation. This is a permanent platform constraint, not a Cowork limitation.

**Evidence.** May 8, 2026 — Cowork hit this during M1 of the toolkit bootstrap. The PAT had every relevant scope; the endpoint simply doesn't exist on github.com. The unblocking move was a 30-second click on github.com/organizations/plan, but in this case we sidestepped entirely by using the personal account (Lesson 21).

**Prescription.** Plan around it. If a workflow requires a new GitHub organization and the user is on github.com (not GHES), the org creation step is a one-time manual click — bake it into the runbook as the only manual step. Do not ask Cowork to attempt the API call; it will fail.

---

## Lesson 23 — Railway has three configuration layers and they must all agree.

**Pattern.** Railway's port and path configuration lives in three independent places: the Dockerfile (`EXPOSE`), the Railway service config (`serviceDomain.targetPort`), and the application code (where it actually binds). All three must match. Setting one is not enough.

**Evidence.** May 8, 2026 — `varshyl-toolkit` demo-host hit four sequential failures during first deploy:
- `EXPOSE 3000` in Dockerfile vs. app binding to `$PORT=8080` from Railway → 502.
- `serviceDomain.targetPort=3000` in Railway proxy config vs. app on 8080 → 502.
- Vite output path `dist/client/` vs. server expecting `../../client/dist` → 404 on the React shell.
- Each fix surfaced the next mismatch. Total recovery: about 25 minutes across multiple Railway redeploys.

**Prescription.** Future Cowork sessions deploying anything to Railway should verify all three layers as a unit, not sequentially after each failure. Add a pre-deploy checklist: Dockerfile `EXPOSE`, Railway `serviceDomain.targetPort`, and `app.listen(process.env.PORT)` — all three must be confirmed before the first build, not discovered through 502s.

---

## Lesson 24 — Railway template variable substitution is unreliable; use explicit values.

**Pattern.** Railway's `${{Postgres.DATABASE_URL}}` reference syntax for cross-service env vars does not always propagate at runtime. The variable shows in the dashboard but resolves empty when the app reads `process.env.DATABASE_URL`.

**Evidence.** May 8, 2026 — `varshyl-toolkit` demo-host failed M9 first deploy because `DATABASE_URL` wasn't resolving even though the Postgres add-on was linked. Fix: set `DATABASE_URL` explicitly with the resolved internal connection string (`postgres://user:pass@postgres.railway.internal:5432/db`). Substitution variant has not been re-tested.

**Prescription.** When wiring a service to a Postgres add-on (or any other service-to-service env reference), set the consuming env var to the explicit value, not a template reference. Add to the Railway provisioning runbook: capture the resolved internal URL at add-on creation time and paste it directly into the consuming service's variables.

---

## Lesson 25 — Not every commit needs Cowork.

**Pattern.** Single-file docs swaps, one-line config changes, and other trivially-small edits can go through GitHub's web UI directly. Reserving Cowork for code work, deploys, and multi-file changes keeps attribution clean and avoids fighting tool limitations (paste size limits, session context overhead).

**Evidence.** May 8, 2026 — Pasting the 15KB `SHARED_MODULE_ARCHITECTURE.md` into Cowork's chat input failed silently ("blank message" error) due to an input size limit. Editing the file directly on github.com via the pencil icon took 90 seconds, produced a clean Vagish-attributed commit, and avoided the size limit entirely.

**Prescription.** Before writing a Cowork prompt, ask: is this one file? Is it under 50 lines of change? Is it documentation or config? If yes to all three, use github.com's web editor. Cowork is for code work and multi-step automation, not for every commit.

---

## Operational rules that come out of these lessons

These are stated in full in `OPS_RULES.md` with explicit cross-references. The short list:

1. Vagish never runs CLI — every action via GitHub API + Railway API through Cowork.
2. Atomic commits, halt-on-error between bugs.
3. All work to staging first when staging is healthy; build off main when staging is orphan (current ConstructIInv state — see `DECISIONS.md` ADR-6).
4. 7-layer QA must be green before merge to main.
5. All migrations `IF NOT EXISTS`.
6. Single-fenced prompts to Cowork.
7. GitHub Git Data API as source of truth when local plumbing is broken.
8. "Tests pass" means real-user verification — committed screenshots or headless browser against live URL. HTTP smoke tests don't count.
9. No fabricated PASS reports. Demand committed file evidence.
10. Diagnostic prompt before every fix prompt. Read-only. Identify root cause. Then fix.
11. Bible §2.2 review on every infra-touching commit. Add `[x] Bible §2.2 reviewed` to the commit message.
12. `package-lock.json` (or `pnpm-lock.yaml`) always committed, never gitignored.
13. brainsync at end of every session, no exceptions.
14. Before declaring a feature missing, check uncommitted work — `git status` on the dev tree, search frontend `fetch()` calls against mounted routes (Lesson 18).
15. Cross-product module interface designed before any product builds it (Lesson 19).
16. Tenant-scoped admin from day one for any user-management surface (Lesson 20).
17. Default to existing infrastructure patterns; fragment only when there's a concrete present-day reason (Lesson 21).
18. Verify Railway uses Dockerfile (not nixpacks auto-detection) on every new service, regardless of how the builder field is configured (Lesson 11 + Lesson 23).
19. Set Railway cross-service env vars to explicit values, not template references (Lesson 24).
20. Trivial single-file docs/config edits go through github.com's web UI, not Cowork (Lesson 25).

---

## Reading order for new sessions

Open this file. Scan titles. If any lesson title matches what you're about to do, read the full entry before starting. Most "new" problems are old lessons.

Specifically:

- About to debug a "missing" feature? → Lessons 1, 13, 18.
- About to commit code? → Lessons 7, 9, 12, 15, 16.
- About to deploy to Railway? → Lessons 3, 11, 14, 23, 24.
- About to write a Cowork prompt? → Lessons 2, 8, 10, 25.
- Disagreement with Vagish about whether something exists? → Lesson 17.
- Building anything reusable across products? → Lessons 19, 20, 21.
- Hit a platform-level "impossible" wall? → Lesson 22.

---

*End of LESSONS.md. Next document in queue: `DECISIONS.md`.*
