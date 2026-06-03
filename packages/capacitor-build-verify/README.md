# @varshylinc/capacitor-build-verify

Verify that a Next.js **static export** (`out/`) and Capacitor native bundles (`ios/App/App/public`, Android assets) contain required UI strings **before** `npx cap sync` or an App Store archive.

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

### Options

| Flag | Description |
|------|-------------|
| `--preset capacitor-basic` | Built-in checks: non-empty `exportDir`, `webDir` matches `capacitor.config`, optional iOS freshness |
| `--enforce-fresh-sync` | With preset: fail if `iosPublicDir` was not modified in the last 60 seconds |
| `--config <path>` | JSON config (default: `.varshyl-cap-verify.json`) |
| `--format human\|json` | Output format (default: `human`) |
| `--cwd <dir>` | Project root (default: current directory) |

Exit code **0** if all checks pass, **1** if any fail.

## Config (`.varshyl-cap-verify.json`)

```json
{
  "exportDir": "out",
  "iosPublicDir": "ios/App/App/public",
  "androidAssetsDir": "android/app/src/main/assets/public",
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

For each check, the tool resolves `globs` under `exportDir` plus native dirs for each listed `platform`, and greps file contents for every `mustContain` string.

## Example `package.json` scripts

```json
{
  "scripts": {
    "build:static": "bash scripts/build-static-export.sh",
    "verify:cap-bundle": "pnpm build:static && varshyl-cap-verify --preset capacitor-basic --config .varshyl-cap-verify.json",
    "build:ios": "pnpm verify:cap-bundle && npx cap sync ios"
  }
}
```

## Programmatic API

```typescript
import { runVerify, formatHuman } from '@varshylinc/capacitor-build-verify';

const report = await runVerify({ cwd: process.cwd(), preset: 'capacitor-basic' });
console.log(formatHuman(report));
```
