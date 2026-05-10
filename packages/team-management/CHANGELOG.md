# Changelog — @varshyl/team-management

## 0.1.0 — 2026-05-08

First production-grade release. v0.0.1 was a stub with no business logic; v0.1.0 is the first version products can actually consume — a complete team management module with org model, RBAC, invitations, audit log, ownership transfer, email change, password reset, and super-admin back office.

### Added

**Org management**
- `POST /orgs` — create organization (name, slug)
- `GET /orgs/:id` — fetch org details
- `PATCH /orgs/:id` — update org name and slug (admin+)
- `DELETE /orgs/:id` — soft-delete with 30-day grace period; must type org name to confirm (owner only)
- Org slug unique partial index (active orgs only)
- Soft-delete columns: `deleted_at`, `delete_scheduled_for`, `deleted_by_user_id`

**Member management**
- `GET /orgs/:id/members` — list active members with roles
- `GET /orgs/:id/members/former` — list removed members with removal metadata
- `DELETE /orgs/:id/members/:userId` — soft-remove member; records `removed_by_user_id` and `removal_reason`
- `PATCH /orgs/:id/members/:userId` — change member role (role-gated per matrix)
- `GET /orgs/:id/members/:userId/cascade-preview` — preview what will be affected by removal

**Invitations** (flag: `enableInvites`)
- `POST /orgs/:id/invitations` — invite by email; sends magic link + 6-digit code in same email; 7-day expiry
- `GET /orgs/:id/invitations` — list pending invitations (admin+)
- `DELETE /orgs/:id/invitations/:invId` — revoke pending invitation (admin+)
- `POST /orgs/:id/invitations/:invId/resend` — regenerate token + code, invalidate old (admin+)
- `GET /orgs/:id/invitations/:invId/code` — fetch decrypted 6-digit code for phone fallback (admin+)
- `GET /invitations/accept/:token` — public magic-link landing; shows org, role, inviter
- `POST /invitations/accept/code` — public code-entry; `{email, code}`
- Sub-A enforcement: member accepting while already in an org gets warning; owner is blocked entirely

**Audit log** (flag: `enableAuditLog`)
- `GET /orgs/:id/audit` — paginated audit events (admin+ only)
- 13 event types: `org.created`, `org.settings.updated`, `org.deleted`, `member.invited`, `member.invite_accepted`, `member.invite_revoked`, `member.removed`, `member.role_changed`, `ownership.transfer_initiated`, `ownership.transfer_accepted`, `ownership.transfer_cancelled`, `email.change_requested`, `email.change_completed`
- Each event stores: `actor_user_id`, `actor_type` (`user`/`super_admin`), `action`, `target_type`, `target_id`, `before` JSONB, `after` JSONB, `ip`, `user_agent`, `reason`, `created_at`
- Super-admin events appear as "Varshyl Support" (real identity never exposed to org)

**Ownership transfer** (flag: `enableOwnershipTransfer`)
- `POST /orgs/:id/transfer` — initiate transfer to an admin (owner only; target must already be admin)
- `GET /orgs/:id/transfer` — get pending transfer details
- `POST /orgs/:id/transfer/:transferId/accept` — accept transfer (atomic role swap)
- `DELETE /orgs/:id/transfer/:transferId` — cancel transfer (either party)
- Transfer locks: no second transfer, no org delete, no party removal during pending transfer
- 7-day expiration; auto-cancelled on expiry

**Email change** (flag: `enableEmailChange`)
- `POST /me/email-change` — request email change; sends verification to new + notice to old
- `GET /me/email-change/verify` — verify new email via token
- `POST /me/email-change/cancel` — cancel via old-email cancellation link; triggers mandatory password reset
- Rate limit: 3 requests per user per 24 hours
- Old-email notice contains cancel link with mandatory-reset semantics if clicked

**Password reset** (flag: `enablePasswordReset`)
- `POST /me/password-reset/request` — self-service; always returns 200 (no user enumeration)
- `POST /me/password-reset/confirm` — confirm with token + new password
- Rate limit: 3 requests per email per hour
- 1-hour token expiry

**Super-admin back office** (flag: `enableSuperAdmin`, default OFF)
- `GET /admin/orgs` — list all orgs including deleted
- `GET /admin/orgs/:id` — org details + members
- `POST /admin/orgs/:id/restore` — restore soft-deleted org during grace period
- `POST /admin/orgs/:id/appoint-owner` — appoint new owner (requires `reason`)
- `POST /admin/orgs/:id/hard-delete` — legal-compliance hard delete (requires `legal_basis`)
- `POST /admin/orgs/:id/members/add` — add member to any org (requires `reason`)
- `POST /admin/orgs/:id/members/remove` — remove member from any org (requires `reason`)
- `POST /admin/users/:id/lock` — lock user account (requires `reason`)
- `POST /admin/users/:id/unlock` — unlock account
- `POST /admin/users/:id/password-reset` — trigger reset link; super-admin never sees password
- All super-admin actions require `reason` text; write audit event with `actor_type='super_admin'`
- Cannot impersonate users; cannot modify product data; cannot set passwords directly

**Self-service**
- `GET /me/membership` — current user's org membership info

**Health**
- `GET /health` — module health with flag states

### Adapter contract changes

11 new required methods added to `ServerModuleAdapter` (all hosts must implement):

| Method | Purpose |
|--------|---------|
| `getUserById(userId)` | Look up user by ID |
| `getUsersByIds(userIds[])` | Batch user lookup |
| `findUserByEmail(email)` | Look up user by email |
| `createUserFromInvite({email, orgId, role})` | Create user on invite accept |
| `setUserPassword(userId, hash)` | Store new password hash |
| `hashPassword(plaintext)` | Hash a password |
| `verifyPassword(plaintext, hash)` | Verify password against hash |
| `invalidateAllUserSessions(userId)` | Invalidate all sessions for user |
| `sendInviteEmail({to, orgName, inviterName, role, magicLinkUrl, code})` | Send invitation email |
| `sendOwnershipTransferEmail({to, orgName, fromName, transferUrl})` | Send transfer notification |
| `sendEmailChangeVerification({to, verifyUrl})` | Send verification to new email |
| `sendEmailChangeOldNotice({to, newEmail, cancelUrl})` | Send notice to old email |
| `sendEmailChangedFinalNotice({to, oldEmail, newEmail})` | Send final confirmation |
| `sendPasswordResetEmail({to, resetUrl})` | Send reset link |
| `sendOrgDeletionNotice({to, orgName, scheduledFor})` | Notify members on org delete |
| `emitNotification({userId, type, payload})` | In-app notification hook |

### Migrations included

| File | Description |
|------|-------------|
| `0001_create_tm_schema_migrations.sql` | Migration ledger table |
| `0002_create_tm_organizations.sql` | Organizations table |
| `0003_create_tm_memberships.sql` | Memberships with soft-delete columns |
| `0004_create_tm_invitations.sql` | Invitations with encrypted code storage |
| `0005_create_tm_audit_events.sql` | Audit events log |
| `0006_create_tm_email_change_requests.sql` | Email change requests |
| `0007_create_tm_ownership_transfers.sql` | Ownership transfer requests |
| `0008_create_tm_super_admins.sql` | Super-admin registry |
| `0009_create_tm_password_reset_requests.sql` | Password reset tokens |
| `0010_create_tm_shared_access.sql` | Shared access scaffold (empty, v0.2.0) |
| `0011_seed_super_admin.sql` | Super-admin seed (idempotent, flag-gated) |

All migrations are forward-only, idempotent (`IF NOT EXISTS`), and tracked in `tm_schema_migrations`.

### Feature flags introduced

| Flag | Default | Description |
|------|---------|-------------|
| `enableInvites` | `true` | Invitation flows (magic link + code) |
| `enableAuditLog` | `true` | Audit log table and routes |
| `enableOwnershipTransfer` | `true` | Ownership transfer flow |
| `enableEmailChange` | `true` | Self-service email change |
| `enablePasswordReset` | `true` | Self-service password reset |
| `enableSuperAdmin` | `false` | Super-admin back office (Varshyl internal) |
| `enableSharedAccess` | `false` | Shared access scaffold (reserved v0.2.0) |
| `enableHardDelete` | `false` | Super-admin direct hard-delete |

Routes return `501 Not Implemented` when their flag is off.

### Locked design decisions (set in v0.1.0; future major bumps may revise)

**Decision 1 — Org model:** Every user belongs to exactly one org at a time. Solo accounts = org of one. `tm_shared_access` scaffolded empty (v0.2.0 placeholder). Multi-contractor vendor case handled by existing vendor-invite system in ConstructIInv (out of scope).

**Decision 2 — Roles:** Four roles: `owner` (unique per org, billing, delete, transfer), `admin` (invite/remove/settings, no audit-visible super-admin identity), `member` (day-to-day, no team powers), `viewer` (read-only). Permission matrix enforced at middleware level.

**Decision 3 — Audit log:** Stored forever. Visible to admin+ only. 13 event types. Super-admin entries visible as "Varshyl Support" — real identity never exposed.

**Decision 4 — Invitations:** Magic link + 6-digit code in same email. AES-256-GCM encryption for codes. 7-day expiry. Sub-A: member accepting into new org gets explicit warning + atomic switch; owner is blocked until they transfer or delete current org.

**Decision 5 — Deletion:** Member removal is soft (`removed_at`). Org deletion is soft with 30-day grace; confirm by typing org name. Background sweep hard-deletes after grace period.

**Decision 6 — Email change:** Verification to new address + immediate notice to old. Cancel from old address triggers mandatory password reset. Rate limit: 3 per user per 24h.

**Decision 7 — Ownership transfer:** Target must already be admin. Confirm by typing org name (initiator) and email (recipient). Atomic role swap on accept. Locks: no second transfer, no org delete, no party removal.

**Decision 8 — Super-admin:** Flag-gated (default OFF). Seeded from `TM_SUPER_ADMIN_EMAIL` env. Cannot impersonate, cannot modify product data, cannot set passwords. All actions require reason text.

---

## v0.0.1 — 2026-04-28

Initial stub. Module scaffolding only — no business logic.
