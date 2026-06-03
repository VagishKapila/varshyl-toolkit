# Contributing

Thanks for helping improve the Varshyl Toolkit.

## Monorepo structure

- `packages/<name>/` — publishable npm packages (`@varshylinc/<name>`)
- `apps/demo-host/` — internal harness that exercises modules against Postgres
- `tests/smoke/` — end-to-end smoke specs run in CI
- `scripts/` — scaffolding, release tagging, pre-push gate
- `examples/` — copy-paste reference snippets (not published to npm)

Packages must not import each other. CI enforces this via `scripts/verify-no-cross-imports.sh`.

## Running tests

From the repo root:

```bash
pnpm install
pnpm verify
```

`pnpm verify` runs, in order: **typecheck → test → build → cross-import check**. All must pass before you open or merge a PR.

Per-package during development:

```bash
pnpm --filter @varshylinc/<package> typecheck
pnpm --filter @varshylinc/<package> test
```

For publish-bound changes, also run:

```bash
pnpm prepush -- @varshylinc/<package>
```

All prepush steps must show `RESULT: PASS`.

## Adding a new package

1. Scaffold from the template:

   ```bash
   bash scripts/new-module.sh <module-name>
   ```

   Creates `packages/<module-name>/` with server migrations, client stubs, and tests patterned on `team-management`.

2. **Naming**
   - npm name: `@varshylinc/<module-name>` (kebab-case)
   - DB table prefix: unique per module (e.g. `tm_`, `as_`, `oce_`) — never share prefixes across packages
   - Migrations: `packages/<module-name>/src/server/migrations/0001_*.sql`, registered in `src/server/index.ts`

3. Define `ServerModuleAdapter` (or equivalent) in `src/server/types.ts`, document the adapter in README, add integration tests under `tests/integration/`.

4. `pnpm install && pnpm verify` before opening a PR.

See [docs/SHARED_MODULE_ARCHITECTURE.md](docs/SHARED_MODULE_ARCHITECTURE.md) for locked architecture rules.

## Pull requests

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) scoped to the package:

```
feat(auth-social): add client barrel export for session helpers
fix(onboarding-consent-engine): handle missing consent key
docs: common gotchas in root README
```

Docs-only or repo-wide tooling may use `docs:` or `chore:` without a scope.

### Changeset requirement

Any change that will ship to npm (features, fixes, breaking API) **must** include a Changesets entry:

```bash
pnpm changeset
```

Select affected packages and bump type (patch / minor / major). Documentation-only PRs that do not publish packages do **not** need a changeset.

After merge to `main`, maintainers run `pnpm changeset version`, then `bash scripts/tag-release.sh <package-name> <X.Y.Z>`.

### PR checklist

- [ ] `pnpm verify` passes locally
- [ ] Changeset added (if publishing)
- [ ] Package README / root README updated when behavior or integration steps change
- [ ] No cross-package imports
- [ ] No secrets in code (`process.env.*` only)

## Code style

- TypeScript strict mode
- Match existing patterns in the package you are editing
- Raw SQL migrations — idempotent, prefixed tables, never edit merged migrations
- No secrets in code — use `process.env.*`

## Questions

Open a [GitHub issue](https://github.com/VagishKapila/varshyl-toolkit/issues).
