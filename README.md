# varshyl-toolkit

Shared module toolbox for Varshyl Inc. products.

## What this is

Modules that Varshyl products install as versioned packages.
Built once, consumed by ConstructInv, BrandOS, and future products.
Each module is independently versioned, tagged, and pinned by products via git tags.

## What this is NOT

- Not a service
- Not a product
- Not a place for product-specific code

## Modules

| Module | Status | Latest tag | QA |
|---|---|---|---|
| team-management | 🟢 **Active v0.1.0** | [team-management-v0.1.0](https://github.com/VagishKapila/varshyl-toolkit/releases/tag/team-management-v0.1.0) | [v0.0.1](qa-evidence/v0.0.1/README.md) · [v0.1.0](qa-evidence/team-management-v0.1.0/) |

## Architecture

See [docs/SHARED_MODULE_ARCHITECTURE.md](docs/SHARED_MODULE_ARCHITECTURE.md).

## How products consume a module

In the product's `package.json`:

```json
"dependencies": {
  "@varshyl/team-management": "github:VagishKapila/varshyl-toolkit#team-management-v0.0.1"
}
```

Then in product server code:

```ts
import { createServerModule } from '@varshyl/team-management';

const tm = createServerModule({ adapter, db, config });
await tm.runMigrations();
app.use('/api/team', tm.router);
```

Then in product React client:

```tsx
import { PlaceholderPage } from '@varshyl/team-management/client';

<Route path='/team' element={<PlaceholderPage />} />
```

## Demo host

`apps/demo-host` is the verification harness. It is **NOT** a product.
It exists only to prove modules work against real Postgres before products consume them.

Live at: https://demo-host-production.up.railway.app

## Versioning

Per-package semver. Tags: `<package-name>-v<X.Y.Z>`.
Root milestone tags: `toolkit-v<X.Y.Z>` (progress markers, not package releases).

To cut a release:
```bash
bash scripts/tag-release.sh team-management 0.0.1
git push origin team-management-v0.0.1
```

See [docs/SHARED_MODULE_ARCHITECTURE.md §4](docs/SHARED_MODULE_ARCHITECTURE.md) for full versioning policy.

## Adding a new module

```bash
bash scripts/new-module.sh <module-name>
```

Scaffolds from the team-management template. Then:
1. Define the adapter interface in `packages/<module-name>/src/server/types.ts`
2. Write the migration SQL in `src/server/migrations/`
3. Fill in `README.md` (all 10 sections)
4. Run `pnpm verify`

## Cowork sessions

See [CLAUDE.md](CLAUDE.md).
