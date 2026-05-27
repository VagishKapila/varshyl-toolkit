# @varshylinc/team-management

> Shared team management module for Varshyl products. Install as a versioned package via git tag.

## Status

**Stub** — architecture in place, features to be implemented in the Team Management design session.

## 1. Installation

```json
"dependencies": {
  "@varshylinc/team-management": "github:VagishKapila/varshyl-toolkit#team-management-v0.0.1"
}
```

## 2. Server setup

```ts
import { createServerModule } from '@varshylinc/team-management';
import type { ServerModuleAdapter } from '@varshylinc/team-management';

// Implement the adapter for your product
const adapter: ServerModuleAdapter = {
  getCurrentUserId: async (req) => req.user?.id ?? null,
  getOrganizationIdForUser: async (userId) => yourDb.getOrgId(userId),
  isUserOrgAdmin: async (userId, orgId) => yourDb.checkAdmin(userId, orgId),
  logger: console,
};

const tm = createServerModule({
  adapter,
  db: yourPgPool,
  config: {
    featureFlags: { enableInvites: false, enableAuditLog: false },
  },
});

// Run on boot — idempotent, safe to call every startup
await tm.runMigrations();

// Mount the router
app.use('/api/team', tm.router);
```

## 3. Client setup

```tsx
import { PlaceholderPage } from '@varshylinc/team-management/client';

// In your React router:
<Route path="/team" element={<PlaceholderPage />} />
```

## 4. DB ownership

All DB tables are prefixed `tm_*`. The module owns them exclusively.
Host products must not query these tables directly — use the module's API.

| Table | Purpose |
|---|---|
| `tm_schema_migrations` | Migration ledger — tracks applied migrations |

## 5. Feature flags

| Flag | Default | Description |
|---|---|---|
| `enableInvites` | `false` | Enable invite flows (stub) |
| `enableAuditLog` | `false` | Enable audit log (stub) |

Routes for disabled flags return `501 Not Implemented`.

## 6. API routes

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Module health + DB connectivity check |
| GET | `/invites` | List invites (flag: `enableInvites`) |
| POST | `/invites` | Create invite (flag: `enableInvites`) |
| GET | `/audit` | Audit log (flag: `enableAuditLog`) |

## 7. Adapter interface

See `src/server/types.ts` for the full `ServerModuleAdapter` interface.

## 8. Versioning

Tags: `team-management-v<X.Y.Z>`. See `CHANGELOG.md` for history.

## 9. Migrations

Migrations are plain SQL files in `src/server/migrations/`, named `NNNN_description.sql`.
`runMigrations()` applies them in order, skipping already-applied ones (ledger in `tm_schema_migrations`).

## 10. Architecture

See `../../docs/SHARED_MODULE_ARCHITECTURE.md` for the full architecture doc.
