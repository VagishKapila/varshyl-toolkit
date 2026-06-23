# @varshylinc/capacitor-build-verify

Verify that a Next.js **static export** (`out/`) and Capacitor native bundles contain required UI strings **before** `npx cap sync` or store submission.

Prevents shipping stale native bundles when source and `.next/` are updated but `out/` was not re-exported (see JobSite Intel, June 2026).

## Install

```bash
pnpm add -D @varshylinc/capacitor-build-verify
```

## CLI

From your Capacitor app root (e.g. `apps/web`):

```bash
npx varshyl-cap-verify --preset capacitor-basic
npx varshyl-cap-verify --config .varshyl-cap-verify.json
npx varshyl-cap-verify --preset capacitor-basic --config .varshyl-cap-verify.json
```

### After Capacitor sync

```bash
pnpm build:static          # refresh out/ from Next static export
npx cap sync ios           # copies webDir → ios/App/App/public
npx cap sync android       # copies webDir → android/app/src/main/assets/public
npx varshyl-cap-verify --preset capacitor-basic --config .varshyl-cap-verify.json --enforce-fresh-sync
```

Use `--enforce-fresh-sync` in CI or pre-archive scripts so native dirs were updated within the last **60 seconds** (right after `cap sync`).

### Options

| Flag | Description |
|------|-------------|
| `--preset capacitor-basic` | Built-in checks: non-empty `exportDir`, `webDir` matches `capacitor.config`, native dirs per `platforms`, optional AndroidManifest `appId`, optional freshness |
| `--enforce-fresh-sync` | With preset: fail if `iosPublicDir` and/or `androidAssetsDir` were not modified in the last 60s |
| `--config <path>` | JSON config (default: `.varshyl-cap-verify.json`) |
| `--format human\|json` | Output format (default: `human`) |
| `--cwd <dir>` | Project root (default: current directory) |

Exit code **0** if all checks pass, **1** if any fail.

## Path conventions

| Key | Default | Capacitor target |
|-----|---------|------------------|
| `exportDir` | `out` | Same as `webDir` in `capacitor.config` — Next.js `output: 'export'` folder |
| `iosPublicDir` | `ios/App/App/public` | Web assets after `npx cap sync ios` |
| `androidAssetsDir` | `android/app/src/main/assets/public` | Web assets after `npx cap sync android` |

Override any path in `.varshyl-cap-verify.json` if your native project layout differs. Unset keys fall back to the defaults above.

**Android note:** Capacitor copies the static export into `android/app/src/main/assets/public` (file URLs under `file:///android_asset/public/`). The tool greps the same `_next/static/...` globs under `exportDir`, `iosPublicDir`, and `androidAssetsDir` — all three should match after a fresh export + sync.

## Config (`.varshyl-cap-verify.json`)

Dual iOS + Android example (see also [`examples/capacitor-build-verify-config.json`](../../examples/capacitor-build-verify-config.json) in the toolkit repo):

```json
{
  "exportDir": "out",
  "iosPublicDir": "ios/App/App/public",
  "androidAssetsDir": "android/app/src/main/assets/public",
  "platforms": ["ios", "android"],
  "verifyAndroidManifest": true,
  "onMissingFiles": "fail",
  "checks": [
    {
      "name": "Danger Zone (account deletion)",
      "globs": ["_next/static/chunks/app/home/settings/*.js"],
      "mustContain": ["Delete My Account", "Danger zone"],
      "platforms": ["ios", "android"]
    }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `platforms` | Which native dirs the **preset** validates (`ios` / `android`). Default: union of `checks[].platforms`, or both if empty. |
| `verifyAndroidManifest` | When `true` (default) and `android` is in `platforms`, preset checks `android/app/src/main/AndroidManifest.xml` contains `package="<appId>"` from `capacitor.config`. |

For each check, the tool resolves `globs` under `exportDir` plus native dirs for each listed `platform`, and greps file contents for every `mustContain` string.

## Example `package.json` scripts

```json
{
  "scripts": {
    "build:static": "bash scripts/build-static-export.sh",
    "verify:cap-bundle": "pnpm build:static && varshyl-cap-verify --preset capacitor-basic --config .varshyl-cap-verify.json",
    "build:ios": "pnpm verify:cap-bundle && npx cap sync ios && varshyl-cap-verify --preset capacitor-basic --enforce-fresh-sync",
    "build:android": "pnpm verify:cap-bundle && npx cap sync android && varshyl-cap-verify --preset capacitor-basic --enforce-fresh-sync"
  }
}
```

## Programmatic API

```typescript
import { runVerify, formatHuman } from '@varshylinc/capacitor-build-verify';

const report = await runVerify({ cwd: process.cwd(), preset: 'capacitor-basic' });
console.log(formatHuman(report));
```

## What developers usually add next

These are not required — but they are the natural
last steps before App Store submission:

💡 Run pnpm build:ios (not pnpm build) before every
iOS submission — this package validates it automatically.

💡 @varshylinc/mobile-payments — if you have in-app
purchases, verify your entitlements are configured
before submitting.
