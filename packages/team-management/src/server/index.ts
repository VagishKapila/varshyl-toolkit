import { Router } from 'express';
import type { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHealthRouter } from './routes/health.routes.js';
import type {
  ServerModuleAdapter,
  TeamManagementConfig,
  TeamManagementServerModule,
} from './types.js';

// Ordered list of migration files. Add new migrations here in order.
const MIGRATIONS: Array<{ name: string; file: string }> = [
  {
    name: '0001_create_tm_schema_migrations',
    file: join(new URL('.', import.meta.url).pathname, 'migrations', '0001_create_tm_schema_migrations.sql'),
  },
];

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
  const flags = config.featureFlags ?? {};

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
      // Check if already applied
      const result = await db.query(
        'SELECT id FROM tm_schema_migrations WHERE migration = $1',
        [migration.name]
      );

      if (result.rows.length > 0) {
        skipped.push(migration.name);
        adapter.logger.info(`[team-management] migration skipped (already applied): ${migration.name}`);
        continue;
      }

      // Apply migration
      const sql = readFileSync(migration.file, 'utf-8');
      await db.query(sql);

      // Record in ledger
      await db.query(
        'INSERT INTO tm_schema_migrations (migration) VALUES ($1)',
        [migration.name]
      );

      applied.push(migration.name);
      adapter.logger.info(`[team-management] migration applied: ${migration.name}`);
    }

    return { applied, skipped };
  };

  // ---- Health handler ----
  const { handler: health, router: healthRouter } = createHealthRouter(db);

  // ---- Main router ----
  const router = Router();

  // Health is always available
  router.use(healthRouter);

  // --- Invites routes (flag-gated, returns 501 when flag is off) ---
  router.get('/invites', (_req, res) => {
    if (!flags.enableInvites) {
      return res.status(501).json({
        error: 'Not implemented',
        detail: 'team-management: enableInvites feature flag is off',
      });
    }
    // Placeholder — real implementation in Team Management design chat
    return res.status(501).json({ error: 'Not implemented', detail: 'Stub — coming soon' });
  });

  router.post('/invites', (_req, res) => {
    if (!flags.enableInvites) {
      return res.status(501).json({
        error: 'Not implemented',
        detail: 'team-management: enableInvites feature flag is off',
      });
    }
    return res.status(501).json({ error: 'Not implemented', detail: 'Stub — coming soon' });
  });

  // --- Audit log routes (flag-gated) ---
  router.get('/audit', (_req, res) => {
    if (!flags.enableAuditLog) {
      return res.status(501).json({
        error: 'Not implemented',
        detail: 'team-management: enableAuditLog feature flag is off',
      });
    }
    return res.status(501).json({ error: 'Not implemented', detail: 'Stub — coming soon' });
  });

  return { router, runMigrations, health };
}

export type { ServerModuleAdapter, TeamManagementConfig, TeamManagementServerModule };
