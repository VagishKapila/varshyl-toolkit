# SHARED_MODULE_ARCHITECTURE.md

Authoritative architecture lives in Construct14 — Bible & Research chat.
The full doc was drafted there on 2026-05-08. To be committed here before v0.1.0.

## Decision summary (locked)

- **Single monorepo:** varshyl-toolkit
- **Modules as versioned packages:** products pin git tags
  `"@varshyl/team-management": "github:VagishKapila/varshyl-toolkit#team-management-v0.0.1"`
- **Adapter pattern** for product-module boundary — modules never query product tables directly
- **No cross-module imports** — enforced by CI (`scripts/verify-no-cross-imports.sh`)
- **Per-module DB ownership** with table prefixes (`tm_*` for team-management, `ts_*` for future)
- **Migration ledger per module** — `tm_schema_migrations` tracks applied migrations idempotently
- **Feature flags** — modules expose `config.featureFlags` to let host products opt-in to features

## §4 Versioning

Per-package semver. Tags: `<package-name>-v<X.Y.Z>`.
Root milestone tags: `toolkit-v<X.Y.Z>` (not a package, a progress marker).

## §5 Session scenarios

When starting a Cowork session on this repo, identify which scenario applies:

1. **New module** — run `bash scripts/new-module.sh <name>`, read the module's README.md, design the adapter interface first
2. **Bug fix** — identify which package is affected, write a failing test first, fix, run `pnpm verify`
3. **Breaking change** — bump major version, update CHANGELOG.md, create new tag via `bash scripts/tag-release.sh`
