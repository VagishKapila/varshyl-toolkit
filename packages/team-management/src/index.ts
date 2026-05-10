// ─── Server exports (Node.js + tsc, DO NOT import in browser bundles) ─────────
export { createServerModule } from './server/index.js';
export type {
  ServerModuleAdapter,
  TeamManagementConfig,
  TeamManagementServerModule,
  OrgRole,
  AuditActorType,
  TransferStatus,
  TmOrganization,
  TmMembership,
  TmInvitation,
  TmAuditEvent,
  TmOwnershipTransfer,
  TmPasswordResetRequest,
  TeamManagementFeatureFlags,
} from './server/types.js';

// ─── Shared types (safe everywhere) ───────────────────────────────────────────
export type { TeamMember, TeamInvite } from './shared/types.js';

// NOTE: Client exports live in packages/team-management/src/client/index.ts
// Import them in your bundler (Vite/webpack) via the "client" export condition:
//   import { PlaceholderPage } from '@varshyl/team-management/client'
