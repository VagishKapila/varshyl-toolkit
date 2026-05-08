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

// Ordered list of migration files. Add new migrations here in order.
const MIGRATIONS: Array<{ name: string; file: string }> = [
  {
    name: '0001_create_tm_schema_migrations',
    file: join(new URL('.', import.meta.url).pathname, 'migrations', '0001_create_tm_schema_migrations.sql'),
  },
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

/**
 * createServerModule — entry point for host products.
 *
 * Usage in host product:
 *   const tm = createServerModule({ adapter, db, config });
 *   await tm.runMigrations();
 *   app.use('/api/team', tm.router);
 */
export function createServerModule(opts: {
  adapter: ServerModuleAdapter;
  db: Pool;
  config: TeamManagementConfig;
}): TeamManagementServerModule {
  const { adapter, db, config } = opts;

  // Merge defaults with provided flags
  const flags: Required<TeamManagementFeatureFlags> = {
    ...DEFAULT_FLAGS,
    ...(config.featureFlags ?? {}),
  };

  const baseUrl = config.baseUrl ?? '';

  // ---- Migration runner ----
  const runMigrations = async (): Promise<{ applied: string[]; skipped: string[] }> => {
    const applied: string[] = [];
    const skipped: string[] = [];

    // Ensure ledger table exists (idempotent — safe to run on every boot)
    const ledgerSql = readFileSync(
      join(new URL('.', import.meta.url).pathname, 'migrations', '0001_create_tm_schema_migrations.sql'),
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
        adapter.logger.info(`[team-management] migration skipped (already applied): ${migration.name}`);
        continue;
      }

      const sql = readFileSync(migration.file, 'utf-8');
      await db.query(sql);

      await db.query(
        'INSERT INTO tm_schema_migrations (migration) VALUES ($1)',
        [migration.name]
      );

      applied.push(migration.name);
      adapter.logger.info(`[team-management] migration applied: ${migration.name}`);
    }

    return { applied, skipped };
  };

  // ---- Boot tasks ----
  // Seed super admin on boot if enableSuperAdmin is true and SUPER_ADMIN_EMAIL is set
  if (flags.enableSuperAdmin) {
    const superAdminEmail = process.env.TM_SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      seedSuperAdmin(db, adapter, superAdminEmail).catch((e) => {
        adapter.logger.warn('[team-management] seedSuperAdmin failed', { error: (e as Error).message });
      });
    }
  }

  // ---- Routers ----
  const { router: healthRouter } = createHealthRouter(db, config);
  const orgsRouter = createOrgsRouter(db, adapter, flags);
  const invitationsRouter = createInvitationsRouter(db, adapter, flags, baseUrl);
  const meRouter = createMeRouter(db, adapter, flags, baseUrl);
  const transferRouter = createTransferRouter(db, adapter, flags, baseUrl);
  const auditRouter = createAuditRouter(db, adapter, flags);
  const adminRouter = createAdminRouter(db, adapter, flags, baseUrl);

  // ---- Main router ----
  const router = Router();

  // Health is always available
  router.use(healthRouter);

  // /me — self-service routes (auth checked inside each handler)
  router.use('/me', meRouter);

  // /orgs — org management (membership-gated inside router)
  router.use('/orgs', orgsRouter);

  // /orgs - invitations sub-routes (mounted at /orgs/:orgId/invitations internally)
  router.use('/orgs', invitationsRouter);

  // /orgs - transfer sub-routes
  router.use('/orgs', transferRouter);

  // /orgs - audit log sub-routes
  router.use('/orgs', auditRouter);

  // /invitations - public accept routes (no auth)
  router.use('/invitations', invitationsRouter);

  // /admin — super-admin gated
  router.use('/admin', adminRouter);

  return { router, runMigrations };
}

export type { ServerModuleAdapter, TeamManagementConfig, TeamManagementServerModule };
