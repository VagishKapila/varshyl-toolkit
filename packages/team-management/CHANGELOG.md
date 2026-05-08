# @varshyl/team-management

## 0.0.1

### Initial scaffold (2026-05-08)

- `createServerModule({ adapter, db, config })` — module entry point
- `ServerModuleAdapter` interface — adapter contract for host products
- `runMigrations()` — idempotent migration runner with ledger table (`tm_schema_migrations`)
- `GET /health` — module health check (DB ping)
- `GET /invites`, `POST /invites` — flag-gated stub (returns 501 when `enableInvites` is false)
- `GET /audit` — flag-gated stub (returns 501 when `enableAuditLog` is false)
- `PlaceholderCard`, `PlaceholderPage` — client-side placeholder components
- `createApiClient` — thin fetch wrapper for client-side API calls
