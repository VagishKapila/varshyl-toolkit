# QA Evidence — v0.0.1

**Captured:** 2026-05-08T21:01:20Z
**Deploy:** `d3eedaa9` (SUCCESS)
**Host:** https://demo-host-production.up.railway.app
**Builder:** Dockerfile (node:20-slim) — §2.2 nixpacks ban: COMPLIANT

## Results

| Endpoint | Status |
|---|---|
| GET /api/health | ✅ 200 |
| GET /api/team/health | ✅ 200 |
| GET / | ✅ 200 |
| GET /team | ✅ 200 |

## Migration log (deploy d3eedaa9)

```
[boot] Postgres connected ✓
[boot] migration applied: 0001_create_tm_schema_migrations
[boot] Migrations complete ✓
[boot] demo-host listening on port 8080 (production) ✓
```
