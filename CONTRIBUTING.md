# Contributing

Thanks for helping improve the Varshyl Toolkit.

## Monorepo structure

- `packages/<name>/` — publishable npm packages (`@varshylinc/<name>`)
- `apps/demo-host/` — internal harness that exercises modules against Postgres
- `tests/smoke/` — end-to-end smoke specs run in CI
- `scripts/` — scaffolding, release tagging, pre-push gate

Packages must not import each other. CI enforces this.

## Before opening a PR

1. Identify which package you are changing.
2. Run typecheck and tests for that package:
   ```bash
   pnpm --filter @varshylinc/<package> typecheck
   pnpm --filter @varshylinc/<package> test
   ```
3. For publish-bound changes, run the full pre-push gate:
   ```bash
   pnpm prepush -- @varshylinc/<package>
   ```
   All steps must show `RESULT: PASS`.

## Release-bound changes

Bug fixes and features that will ship to npm need a Changesets entry:

```bash
pnpm changeset
pnpm changeset version   # after PR merge, before tagging
```

Each release must include an updated `CHANGELOG.md` section for the bumped version.

## Code style

- TypeScript strict mode
- Match existing patterns in the package you are editing
- Raw SQL migrations — idempotent, prefixed tables, never edit merged migrations
- No secrets in code — use `process.env.*`

## Questions

Open a [GitHub issue](https://github.com/VagishKapila/varshyl-toolkit/issues).
