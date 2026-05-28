# @varshylinc/team-management

**Version:** 0.2.0  
**Status:** Production — org/people admin, full team ops from 0.1.0

Shared team-management module for Varshyl products. Host products mount the server router and embed client pages; all `tm_*` tables are owned exclusively by this module.

## Phase 1 billing (this release)

Orgs add members **free now** — no Stripe seat billing yet (Phase 2). Billing enforcement is **dark**: added members use the product normally. The Org/People page includes a **disabled seat-usage panel** structured so Phase 2 can turn it into assign/unassign controls without a rebuild.

Members are keyed by the host **`userId`** (same id space as `@varshylinc/auth-social` and `@varshylinc/mobile-payments`) for 1:1 future seat mapping. Do **not** import `mobile-payments` from this module until Phase 2.

## Server (0.1.0 + 0.2.0)

```ts
import { createServerModule, addOrgMember, listOrgMembers, getOrgHierarchy } from '@varshylinc/team-management';

const tm = createServerModule({ adapter, db: pool, config });
await tm.runMigrations();
app.use('/api/team', tm.router);
```

**0.2.0 programmatic org-admin API** (reuse in host jobs/scripts):

| Function | Purpose |
|---|---|
| `addOrgMember` | Add roster record by email (creates host user via adapter if missing) |
| `listOrgMembers` | Active members enriched with email/name |
| `getOrgHierarchy` | Members grouped by role |
| `updateOrgMember` | Change role and/or display name |
| `removeOrgMember` | Soft-remove member |

**0.1.0 HTTP surface** (unchanged): org CRUD, invitations, audit, ownership transfer, email change, password reset, super-admin back office. See `CHANGELOG.md`.

## Client (0.2.0)

```tsx
import {
  OrgPeoplePage,
  useOrgMembers,
  orgAdminActions,
  setTeamTheme,
} from '@varshylinc/team-management/client';

setTeamTheme({ paper: '#FAF7F0', brick: '#8B3A2F' }); // Blueprint & Brick default

<OrgPeoplePage orgId={orgId} onInvite={optionalEmailHook} />
```

- **`OrgPeoplePage`** — admin adds people, views roster + hierarchy, edits roles, removes members (with confirm).
- **`useOrgMembers(orgId)`** — list + mutation helpers.
- **`orgAdminActions`** — SOREN-callable bundle: `{ addMember, updateMember, removeMember, listMembers }`.

Default roster add creates a **member record now**; optional `onInvite` callback on `OrgPeoplePage` is a no-op hook for real email invites later (mirrors auth-social mailer-adapter pattern).

## Theming

Blueprint & Brick default (`Paper`, `Brick`, `Brass`, `Ink`, Fraunces + Inter). Job Site Intel.ai passes Sage + Soren at integration via `setTeamTheme`.

## Adapter

Implement `ServerModuleAdapter` in `src/server/types.ts`. Optional **`updateUserName`** for display-name edits on the Org/People page.

## Exports map

All entry points (`.`, `./server`, `./client`) expose `types`, `require`, and `import` conditions pointing at built `dist/` files.
