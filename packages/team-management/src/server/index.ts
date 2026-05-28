import { Router } from 'express';
import type { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHealthRouter } from './routes/health.routes.js';
import { createOrgsRouter } from './routes/orgs.routes.js';
import { createInvitationsRouter } from './routes/invitations.routes.js';
import { createMeRouter } from './routes/me.routes.js';
import { createTransferRouter } from './routes/transfer.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';
import { seedSuperAdmin } from './services/super-admin.service.js';
import type {
  ServerModuleAdapter,
  TeamManagementConfig,
  TeamManagementServerModule,
  TeamManagementFeatureFlags,
} from './types.js';

const migrationsDir = join(new URL('.', import.meta.url).pathname, 'migrations');

// All migrations in order. Append new migrations here — never reorder or remove.
const MIGRATIONS: Array<{ name: string; file: string }> = [
  { name: '0001_create_tm_schema_migrations', file: join(migrationsDir, '0001_create_tm_schema_migrations.sql') },
  { name: '0002_create_tm_organizations',    file: join(migrationsDir, '0002_create_tm_organizations.sql') },
  { name: '0003_create_tm_memberships',      file: join(migrationsDir, '0003_create_tm_memberships.sql') },
  { name: '0004_create_tm_invitations',      file: join(migrationsDir, '0004_create_tm_invitations.sql') },
  { name: '0005_create_tm_audit_events',     file: join(migrationsDir, '0005_create_tm_audit_events.sql') },
  { name: '0006_create_tm_email_change_requests',  file: join(migrationsDir, '0006_create_tm_email_change_requests.sql') },
  { name: '0007_create_tm_ownership_transfers',    file: join(migrationsDir, '0007_create_tm_ownership_transfers.sql') },
  { name: '0008_create_tm_super_admins',           file: join(migrationsDir, '0008_create_tm_super_admins.sql') },
  { name: '0009_create_tm_password_reset_requests',file: join(migrationsDir, '0009_create_tm_password_reset_requests.sql') },
  { name: '0010_create_tm_shared_access',          file: join(migrationsDir, '0010_create_tm_shared_access.sql') },
  { name: '0011_seed_super_admin',                 file: join(migrationsDir, '0011_seed_super_admin.sql') },
  { name: '0012_create_tm_user_locks',             file: join(migrationsDir, '0012_create_tm_user_locks.sql') },
];

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

// ── Standalone migration runner ─────────────────────────────────────────────
// Exported so tests and globalSetup can call it directly without a full module.
export async function runMigrations(
  db: Pool,
  logger: { info(msg: string): void } = { info: () => {} }
): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = [];
  const skipped: string[] = [];

  // Boot step: ensure ledger table exists (idempotent — CREATE TABLE IF NOT EXISTS)
  const ledgerSql = readFileSync(
    join(migrationsDir, '0001_create_tm_schema_migrations.sql'),
    'utf-8'
  );
  await db.query(ledgerSql);

  for (const migration of MIGRATIONS) {
    const result = await db.query(
      'SELECT id FROM tm_schema_migrations WHERE migration = $1',
      [migration.name]
    );

    if (result.rows.length > 0) {
      skipped.push(migration.name);
      logger.info(`[team-management] skipped: ${migration.name}`);
      continue;
    }

    const sql = readFileSync(migration.file, 'utf-8');
    await db.query(sql);
    await db.query(
      'INSERT INTO tm_schema_migrations (migration) VALUES ($1)',
      [migration.name]
    );

    applied.push(migration.name);
    logger.info(`[team-management] applied: ${migration.name}`);
  }

  return { applied, skipped };
}

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

export type { ServerModuleAdapter, TeamManagementConfig, TeamManagementServerModule };
export {
  addOrgMember,
  listOrgMembers,
  getOrgHierarchy,
  updateOrgMember,
  removeOrgMember,
} from './org-admin.js';
export type { OrgMemberRecord, OrgHierarchyGroup } from './org-admin.js';
