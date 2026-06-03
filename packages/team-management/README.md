# @varshylinc/team-management

> Organization and team management for SaaS: member roster, roles and hierarchy, an admin People page, and a seat-ready data model.

![npm](https://img.shields.io/npm/v/@varshylinc/team-management)
![license](https://img.shields.io/npm/l/@varshylinc/team-management)

Part of the **Varshyl Toolkit** — a set of independent, composable packages for building Capacitor + web SaaS apps.

## Screenshots

Admin Org/People page — roster, role hierarchy, and add-member in one screen for org owners.

![Org People admin page listing team members, roles, and add-member controls](https://varshyl-toolkit-demo.netlify.app/screenshots/org-people-page.png)

## What it does

Provides org CRUD, member roster, role hierarchy, invitations, audit log, ownership transfer, and an admin Org/People page. The host product implements a small adapter for identity and authorization; the module owns all `tm_*` tables. Members are keyed by host `userId` for future seat mapping with `@varshylinc/mobile-payments`.

## Install

```bash
npm install @varshylinc/team-management
```

Peer dependencies: `express`, `pg`, `react`.

## Quick start

**Server** — implement the adapter, migrate, mount the router:

```ts
import { Pool } from 'pg';
import express from 'express';
import { createServerModule } from '@varshylinc/team-management';
import type { ServerModuleAdapter } from '@varshylinc/team-management';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter: ServerModuleAdapter = {
  getCurrentUserId: async (req) => req.user?.id ?? null,
  getOrganizationIdForUser: async (userId) => yourDb.getOrgId(userId),
  isUserOrgAdmin: async (userId, orgId) => yourDb.isAdmin(userId, orgId),
  logger: console,
};

const tm = createServerModule({ adapter, db: pool, config: { baseUrl: 'https://yourapp.com' } });
await tm.runMigrations();

const app = express();
app.use('/api/team', tm.router);
```

**Client** — theme + Org/People page:

```tsx
import { OrgPeoplePage } from '@varshylinc/team-management/client';

function TeamAdmin({ orgId }: { orgId: number }) {
  return <OrgPeoplePage orgId={orgId} />;
}
```

## Entry points

| Import path | Exports |
|---|---|
| `@varshylinc/team-management` | `createServerModule`, `runMigrations`, `addOrgMember`, `listOrgMembers`, `getOrgHierarchy`, `updateOrgMember`, `removeOrgMember`, types |
| `@varshylinc/team-management/server` | Same server exports — use when you want an explicit server-only import path |
| `@varshylinc/team-management/client` | `OrgPeoplePage`, `MembersPage`, `TeamManagementThemeProvider`, `useTeamManagementTheme`, `useOrgMembers`, `orgAdminActions`, `setTeamTheme`, API helpers, … |

## Database

Bring your own Postgres. Call `runMigrations()` (via the module instance or standalone export) on boot. Tables use the `tm_` prefix (`tm_organizations`, `tm_memberships`, `tm_invitations`, `tm_audit_events`, …). Migrations ship inside `dist/server/migrations/`.

## Theming

Team UI reads **AuthTheme-compatible** tokens via `TeamManagementThemeProvider` (same shape as auth-social — pass one `theme` object to both providers; modules do not cross-import).

### Recommended: dual provider at app root

```tsx
import { AuthThemeProvider } from '@varshylinc/auth-social/client';
import {
  TeamManagementThemeProvider,
  OrgPeoplePage,
} from '@varshylinc/team-management/client';

const theme = {
  primary: '#3A6B5F',
  primaryHover: '#2D544A',
  surface: '#FAF7F0',
  border: '#e8e0d0',
  text: '#211D18',
  textMuted: '#8a7f6f',
  error: '#8B3A2F',
  success: '#2D6A4F',
  radius: '12px',
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthThemeProvider theme={theme}>
      <TeamManagementThemeProvider theme={theme}>{children}</TeamManagementThemeProvider>
    </AuthThemeProvider>
  );
}
```

Without any provider, components render using `DEFAULT_TEAM_APP_THEME` (matches pre-0.4.0 Blueprint & Brick defaults). Dev mode logs a one-time `console.warn` pointing here.

### Legacy: `setTeamTheme()`

Still supported — maps `paper` / `brick` / `brass` / `ink` to the new token model:

```ts
setTeamTheme({ paper: '#FAF7F0', brick: '#8B3A2F', brass: '#B8893E', ink: '#211D18' });
```

### `*ClassName` overrides (examples)

| Component | Props |
|-----------|--------|
| `OrgPeoplePage` | `pageClassName`, `headerClassName` |
| `InviteForm` | `inviteFormClassName`, `emailInputClassName`, `submitButtonClassName`, `errorClassName` |
| `MemberRow` | `memberRowClassName`, `removeButtonClassName` |
| `DangerZoneCard` | `cardClassName`, `modalClassName`, `confirmButtonClassName` |

### CSS variables (no provider)

| Variable | Role |
|----------|------|
| `--tm-primary` | Headings, primary buttons |
| `--tm-primary-hover` | Button hover |
| `--tm-surface` | Page background |
| `--tm-ink` | Body text |
| `--tm-muted` | Secondary text |
| `--tm-danger` | Errors, remove actions, danger zone |
| `--tm-success` | Success messages |
| `--tm-border` | Borders |
| `--tm-radius` / `--tm-button-radius` | Corners |
| `--tm-card-surface` | Card backgrounds |
| `--tm-font-heading` / `--tm-font-body` | Typography |

Optional: `@import '@varshylinc/team-management/dist/client/components/TeamManagementStyles.css'` in your bundler.

## See also

- [@varshylinc/auth-social](../auth-social) — shared `userId` for member records
- [@varshylinc/mobile-payments](../mobile-payments) — seat billing integration (Phase 2)
- [@varshylinc/onboarding-consent-engine](../onboarding-consent-engine) — consent at signup

## License

Apache-2.0 © Vagish Kapila / Varshyl Inc.
