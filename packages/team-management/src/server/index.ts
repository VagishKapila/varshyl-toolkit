import { Router } from 'express';
import type { Pool } from 'pg';
import { createHealthRouter } from './routes/health.routes.js';
import { createOrgsRouter } from './routes/orgs.routes.js';
import { createInvitationsRouter } from './routes/invitations.routes.js';
import { createMeRouter } from './routes/me.routes.js';
import { createTransferRouter } from './routes/transfer.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { seedSuperAdmin } from './services/super-admin.service.js';
import { runMigrations, type RunMigrationsOptions } from './migrations.js';
import {
  createTmPool,
  DEFAULT_TM_CONNECTION_TIMEOUT_MS,
  DEFAULT_TM_OPERATION_TIMEOUT_MS,
  type CreateTmPoolOptions,
} from './pool.js';
import { tmSelfTest, type TmSelfTestOptions, type TmSelfTestResult } from './selfTest.js';
import { TmError, type TmErrorCode } from './errors.js';
import type {
  ServerModuleAdapter,
  TeamManagementConfig,
  TeamManagementServerModule,
  TeamManagementFeatureFlags,
} from './types.js';

// Default feature flags for v0.1.0
const DEFAULT_FLAGS: Required<TeamManagementFeatureFlags> = {
  enableInvites: true,
  enableAuditLog: true,
  enableOwnershipTransfer: true,
  enableEmailChange: true,
  enablePasswordReset: true,
  enableSuperAdmin: false,
  enableSharedAccess: false,
  enableHardDelete: false,
};

/**
 * createServerModule — entry point for host products.
 *
 * Usage (production):
 *   const tm = createServerModule({ adapter, db, config });
 *   await tm.runMigrations();
 *   app.use('/api/team', tm.router);
 *
 * Usage (test shorthand — pool and features accepted as aliases):
 *   const tm = createServerModule({ adapter, pool, features });
 */
export function createServerModule(opts: {
  adapter: ServerModuleAdapter;
  /** pg Pool — use `db` or `pool` interchangeably */
  db?: Pool;
  /** Alias for db */
  pool?: Pool;
  /** Full config object (takes precedence over individual fields below) */
  config?: TeamManagementConfig;
  /** Shorthand for config.featureFlags */
  features?: Partial<TeamManagementFeatureFlags>;
  /** Shorthand for config.baseUrl */
  baseUrl?: string;
}): TeamManagementServerModule {
  const db = (opts.db ?? opts.pool)!;
  const featureFlags: Partial<TeamManagementFeatureFlags> =
    opts.config?.featureFlags ?? opts.features ?? {};
  const baseUrl = opts.config?.baseUrl ?? opts.baseUrl ?? '';
  const config: TeamManagementConfig = { featureFlags, baseUrl };
  const { adapter } = opts;

  const flags: Required<TeamManagementFeatureFlags> = {
    ...DEFAULT_FLAGS,
    ...featureFlags,
  };

  // ── Super-admin seed on boot ────────────────────────────────────────────────

  if (flags.enableSuperAdmin) {
    const superAdminEmail = process.env.TM_SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      seedSuperAdmin(db, adapter, superAdminEmail).catch(e => {
        adapter.logger.warn('[team-management] seedSuperAdmin failed', {
          error: (e as Error).message,
        });
      });
    }
  }

  // ── Routers ─────────────────────────────────────────────────────────────────

  const { router: healthRouter } = createHealthRouter(db, config);
  const orgsRouter        = createOrgsRouter(db, adapter, flags);
  const invitationsRouter = createInvitationsRouter(db, adapter, flags, baseUrl);
  const meRouter          = createMeRouter(db, adapter, flags, baseUrl);
  const transferRouter    = createTransferRouter(db, adapter, flags, baseUrl);
  const auditRouter       = createAuditRouter(db, adapter, flags);
  const adminRouter       = createAdminRouter(db, adapter, flags, baseUrl);

  const router = Router();

  router.use(healthRouter);
  router.use('/me', meRouter);
  router.use('/orgs', orgsRouter);
  router.use('/orgs', invitationsRouter);
  router.use('/orgs', transferRouter);
  router.use('/orgs', auditRouter);
  router.use('/invitations', invitationsRouter);
  router.use('/admin', adminRouter);

  const migrate = () => runMigrations(db, adapter.logger);

  return { router, runMigrations: migrate, migrate };
}

export { runMigrations, createTmPool, tmSelfTest, TmError };
export type {
  RunMigrationsOptions,
  CreateTmPoolOptions,
  TmSelfTestOptions,
  TmSelfTestResult,
  TmErrorCode,
};
export { DEFAULT_TM_CONNECTION_TIMEOUT_MS, DEFAULT_TM_OPERATION_TIMEOUT_MS };
export type { ServerModuleAdapter, TeamManagementConfig, TeamManagementServerModule };
export {
  addOrgMember,
  listOrgMembers,
  getOrgHierarchy,
  updateOrgMember,
  removeOrgMember,
} from './org-admin.js';
export type { OrgMemberRecord, OrgHierarchyGroup } from './org-admin.js';
