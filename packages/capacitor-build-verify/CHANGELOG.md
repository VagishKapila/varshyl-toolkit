# @varshylinc/capacitor-build-verify

## 0.2.0

### Minor Changes

- **Android preset checks:** `capacitor-basic` validates non-empty `androidAssetsDir` when `platforms` includes `android`.
- **`--enforce-fresh-sync` for Android:** same 60s mtime guard as iOS, applied to `android/app/src/main/assets/public` (configurable via `androidAssetsDir`).
- **AndroidManifest preset check:** optional (default on) — verifies `android/app/src/main/AndroidManifest.xml` references `appId` from `capacitor.config`.
- Config: `platforms` and `verifyAndroidManifest` for preset scope.
- Integration fixtures: `android-pass`, `android-stale-sync`.

## 0.1.0

### Minor Changes

- Initial release: `varshyl-cap-verify` CLI and programmatic `runVerify()` API.
- JSON config (`.varshyl-cap-verify.json`) with glob + `mustContain` checks across `exportDir`, iOS public, and Android assets paths.
- `--preset capacitor-basic` for export folder presence, `capacitor.config` `webDir` alignment, and optional `--enforce-fresh-sync` (iOS public dir modified within 60s).
- Human and `--format json` output for local dev and CI.

Motivation: JobSite Intel AI (June 2, 2026) nearly submitted an iOS build to Apple without the account-deletion Danger Zone UI — source and production web were correct, but the Capacitor `out/` static export had not been refreshed before `cap sync`.
