# BIBLE.md

> **Role in the doc set:** The router. The single entry point every Cowork session, every Claude session, and every Varshyl team member reads first. Tells you which doc has what, in what order to read them, when to update each one.
>
> **Why this is small.** This file is intentionally short. It doesn't repeat content — it points at it. If you find yourself adding more than a screenful of content here, that content belongs in one of the other docs and this file should just link to it.
>
> **Last updated:** May 10, 2026.

---

## What this doc set is

Eight Markdown files in `varshyl-toolkit/docs/` that together replace the old single-file Bible v4 model. Each doc has a clear scope, a clear lifecycle, and a clear owner action. Together they hold every piece of canonical knowledge about how Varshyl builds, ships, and operates products.

The strategic move: stable content (lessons, decisions) is decoupled from volatile content (production state, backlog). Updating production state weekly doesn't require touching the lessons file. Adding a new lesson doesn't require re-shipping the whole Bible.

---

## The eight docs

| Doc | Scope | Lifecycle | When to read |
|---|---|---|---|
| **BIBLE.md** (this file) | Router. Points at everything else. | Updated only when the doc set itself changes. | First, every session. |
| **LESSONS.md** | Numbered lessons learned. Patterns, not incidents. | Append-only. New lessons get added; old ones never get deleted. Reopen log if a lesson gets revised. | When starting non-trivial work, scan titles for matches to what you're about to do. |
| **DECISIONS.md** | Architectural decision records (ADRs). Locked decisions. | Append-only. Decisions can be reopened (with a Reopen log entry) but never silently edited. | Before making any decision that might already be locked. |
| **OPS_RULES.md** | Prescriptive operational rules. Citation-numbered (OPS-1, OPS-2, ...). | Updated when a lesson promotes to a rule, or when a rule is reopened. | Every Cowork session. Every PR. |
| **BACKLOG.md** | What's coming next. Tier-prioritized. | Updated continuously. Items added when they emerge, moved to "Shipped" when complete. | When deciding what to work on next. |
| **MODULES.md** | Registry of every module (toolkit and inline). Status, owner, public API. | Updated when a module changes state or a new module is registered. | Before building anything new — does it already exist? |
| **PRODUCTION_STATE.md** | Current production reality. What's live, broken, degraded. | Rewritten weekly. After any major production change. | Before any production change. |
| **SHARED_MODULE_ARCHITECTURE.md** | Architecture of the toolkit (`varshyl-toolkit`). Module pattern, adapter contract, version pinning, phased rollout. | Stable. Updated only on architectural change. | When building a toolkit module or integrating one into a product. |

Plus per-module files inside `varshyl-toolkit/packages/<module>/`:
- `README.md` — install + usage + adapter contract
- `CHANGELOG.md` — release notes per version
- `MODULE.md` (where it exists) — locked specification

---

## Reading order — first-time on a product

If you've never touched this codebase before, read in this order:

1. **BIBLE.md** (this file) — orient yourself.
2. **OPS_RULES.md** — the rules every action follows. Don't violate these.
3. **SHARED_MODULE_ARCHITECTURE.md** — only if working in the toolkit or integrating a toolkit module into a product. Otherwise skip.
4. **DECISIONS.md** — scan the quick-scan table at the bottom for the one-liners. Read full ADRs only for decisions that affect your current task.
5. **MODULES.md** — find the module(s) you're touching.
6. **PRODUCTION_STATE.md** — confirm current production reality matches your assumptions.
7. **BACKLOG.md** — is your work already in the queue?
8. **LESSONS.md** — scan titles. Read full lessons only for those that match what you're about to do.

After the first read, you only need to re-read what's relevant.

---

## Reading order — every session, every time

The minimum reading every session:

1. **BIBLE.md** (this file, briefly — re-orient).
2. **BRAIN.md** (working memory — what happened last session, what's in flight).
3. The relevant doc for today's task (per the table above).

`BRAIN.md` lives at the repo root, not in `docs/`. It's the per-session working memory — updated by BrainSync at the end of every session.

---

## How to update each doc

| Doc | Who/when |
|---|---|
| **BIBLE.md** | When a new doc joins the set, or a doc gets renamed/restructured. Rare. |
| **LESSONS.md** | Append a new lesson when (a) the same mistake happens twice, or (b) a single mistake costs more than an hour to recover from. New lesson goes through BrainSync at session end. |
| **DECISIONS.md** | Append a new ADR whenever a locked decision is made. Format matches existing ADRs. Reopen log entry if reopening. |
| **OPS_RULES.md** | Promote a lesson to a rule when it's prescriptive and universally applied. Cross-reference the source lesson. |
| **BACKLOG.md** | When a new item emerges, add to the right tier with one-line state + one-line action. When an item ships, move to "Shipped" at bottom. Long discussions live elsewhere. |
| **MODULES.md** | When a module changes status (Stub → Active, etc.), update the table AND add an entry to the changelog section at the bottom. |
| **PRODUCTION_STATE.md** | Rewrite (not append) every Monday. Walk through each product, confirm status against live, update. |
| **SHARED_MODULE_ARCHITECTURE.md** | Only when toolkit architecture itself changes. Reopen log if a section is revised. |

---

## Update mechanisms

Three layers of doc maintenance:

**Layer 1 — BrainSync at session end (OPS-6).**
Every session ends with a BrainSync. The BrainSync trigger lives in the master start prompt, so it fires automatically. BrainSync updates:
- `BRAIN.md` (always)
- `LESSONS.md` (if a new lesson emerged)
- `DECISIONS.md` (if a new decision was made)
- `OPS_RULES.md` (if a lesson promoted to a rule)
- `BACKLOG.md` (if a new item emerged or one shipped)
- `MODULES.md` (if a module changed status)
- `PRODUCTION_STATE.md` (if production changed significantly)

**Layer 2 — Feature PRs touch docs (OPS-27).**
Every PR that ships behavior changes includes doc updates in the same PR. Target state: a GitHub Action that warns (not blocks) when a feature PR doesn't touch `docs/`. Warning-level, not blocking — sometimes a feature genuinely doesn't need docs.

**Layer 3 — Monthly doc audit (OPS-28).**
First Monday of every month, ~30 minutes. Run a doc audit against recent commits and chat history. Flag drift. Fix what's stale. Catches what BrainSync and PR-level updates miss.

---

## What goes where — quick reference

When something happens, where does it land?

| Event | Lands in |
|---|---|
| Same bug pattern hit twice | LESSONS.md (new lesson) |
| Architectural choice locked | DECISIONS.md (new ADR) |
| Lesson promoted to a rule | OPS_RULES.md (new OPS-N) |
| New feature requested or designed | BACKLOG.md (right tier) |
| Module shipped, retired, or stubbed | MODULES.md (status update + changelog entry) |
| Production state changed materially | PRODUCTION_STATE.md (rewrite affected section) |
| Toolkit architecture revised | SHARED_MODULE_ARCHITECTURE.md (with Reopen log entry) |
| Session-specific working memory | BRAIN.md (per-product, repo root) |

If you're not sure, default to BRAIN.md and let next-session promote to the right canonical doc.

---

## What this doc set is NOT

- Not a CRM (customer info lives in your business systems, not here).
- Not a product roadmap (high-level strategy lives elsewhere; BACKLOG.md is tactical).
- Not a knowledge base for end-users (customer-facing docs live in product help systems).
- Not a substitute for code comments (the code is the source of truth for what code does; these docs are the source of truth for WHY).

---

## Versioning of the doc set itself

If the doc set's structure changes (new doc added, doc removed, major reorganization), bump a version in this file's last-updated note. Current structure: v1, May 10, 2026. If we later restructure into more/fewer docs, this becomes v2 with a brief migration note here.

---

## When this doc set falls behind

If you find a contradiction between the docs and reality, **the docs are wrong, not reality**. Fix the docs in the same session you noticed the drift. Don't defer doc updates to a future session — that's how drift compounds.

Examples of drift to watch for:
- A module status in MODULES.md says "Active" but the route returns 404 in PRODUCTION_STATE.md
- An ADR in DECISIONS.md says "X is locked" but recent commits contradict it
- A rule in OPS_RULES.md is consistently being violated and nobody's enforcing it (either reopen the rule or fix the practice)

---

## Final principle

Documentation is a tool, not a destination. The docs serve the work. When a doc gets in the way more than it helps, fix it. When a doc would help and doesn't exist, write it.

The eight docs above are the canonical set as of May 10, 2026. They will evolve. The structure is stable enough that a Varshyl team member or Claude session can find what they need; flexible enough that we can refine without rewriting.

---

*End of BIBLE.md.*

*The eight-doc foundation is complete. Phase 2 (commit to GitHub) is next.*
