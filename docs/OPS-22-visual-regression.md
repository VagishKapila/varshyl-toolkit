# OPS-22 — Visual Regression for Smoke Tests

**Status:** Active  
**Adopted:** 2026-05-17  
**Scope:** `tests/smoke/` — Playwright smoke tests against live demo-host

---

## Rule

Every smoke-test scenario MUST include a `toHaveScreenshot()` assertion after
the DOM-level assertions. Pixel-diff tolerance is **2% (`maxDiffPixelRatio: 0.02`)**.

```typescript
// Required at the end of every smoke test scenario
await expect(page).toHaveScreenshot('S<N>-<name>.png', { maxDiffPixelRatio: 0.02 });
```

---

## Baseline storage

Baselines live in `tests/smoke/__screenshots__/` (gitignored-adjacent, committed
to the repo). Playwright matches the OS/browser pair when comparing — baselines
generated on `ubuntu-latest` Chromium (CI) are the canonical source of truth.

**Never commit baselines generated on macOS or Windows.** Those differ in
sub-pixel rendering and will produce false failures in CI.

---

## Creating / updating baselines

```bash
# First run — create all baselines
DEMO_HOST_URL=https://demo-host-production.up.railway.app \
  pnpm exec playwright test --update-snapshots

# After intentional UI change — update only one scenario
DEMO_HOST_URL=... pnpm exec playwright test --update-snapshots -g "S1"
```

After updating, commit the new baseline files:
```bash
git add tests/smoke/__screenshots__/ && git commit -m "test: update visual baselines"
```

---

## Why Playwright-native (not Argos)

Argos CI requires OAuth through a browser to connect the repo — that flow is
not available in the Cowork sandbox. Playwright's built-in `toHaveScreenshot()`
provides equivalent per-commit regression detection with no external service
dependency.

If Argos OAuth becomes available, the setup is: `npx @argos-ci/playwright@latest`
→ replace `toHaveScreenshot()` with `argosScreenshot()` → set `ARGOS_TOKEN` repo secret.

---

## Workflow integration

The `.github/workflows/smoke-test.yml` workflow does NOT pass `--update-snapshots`.
If a scenario fails its visual diff:

1. Download the `playwright-artifacts` artifact from the failed run
2. Compare `expected` vs `actual` in `test-results/`
3. If the change is intentional: run `--update-snapshots` locally (on Linux/Chromium)
   and commit the new baseline
4. If the change is a regression: fix the UI code

---

> This rule replaces any prior ad-hoc screenshot approach. Insert as **OPS-22**
> in `docs/OPS_RULES.md` when PR #3 (`docs/foundation-2026-05-10`) is merged.
