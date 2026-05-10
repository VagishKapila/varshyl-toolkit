# QA Evidence — team-management v0.1.0

**Date:** 2026-05-10  
**Deploy:** https://demo-host-production.up.railway.app  
**Builder:** DOCKERFILE (confirmed via `apps/demo-host/railway.json`)  
**Result:** ✅ 6/6 scenarios PASS

## Scenarios

| # | Scenario | Method | Endpoint | Status | Result |
|---|---|---|---|---|---|
| S1 | List org members | GET | `/api/team/orgs/1/members` | 200 | ✅ PASS |
| S2 | Create invitation | POST | `/api/team/orgs/1/invitations` | 201 | ✅ PASS |
| S3 | Audit log | GET | `/api/team/orgs/1/audit` | 200 | ✅ PASS |
| S4 | Ownership transfer | POST | `/api/team/orgs/1/transfer` | 201 | ✅ PASS |
| S5 | Admin: list all orgs | GET | `/api/team/admin/orgs` | 200 | ✅ PASS |
| S6 | Admin: password reset | POST | `/api/team/admin/users/3/password-reset` | 200 | ✅ PASS |

## Detail

**S1** — 4 members returned: Sarah Chen (owner), Mike Torres (admin), Jane Williams (member), Tom Nakamura (viewer)

**S2** — Invitation id=2 created for alex@demo.varshyl.com as member, status=pending, expires 2026-05-13

**S3** — 3 audit events, latest: `action=member.invited` by actor=1 (Sarah)

**S4** — Transfer id=2 from Sarah (user_id=1) → Mike (user_id=2), status=pending, expires 2026-05-12

**S5** — Super-admin endpoint returned 1 org: "Demo Construction Co." id=1 ✓  
(Super-admin seeded via `seedDemoData()` boot function, commit `3fcd6ce`)

**S6** — `{"message":"Password reset email sent"}` for Jane Williams (user_id=3) ✓

## CI Status

- 291 tests passing, 23 test files, 6 skipped, 0 failed (commit `bbd8081`)
- GitHub Release `team-management-v0.1.0` created with full CHANGELOG body
- Tag `team-management-v0.1.0` → SHA `5ba07a24`
- README: `🟢 Active v0.1.0`
