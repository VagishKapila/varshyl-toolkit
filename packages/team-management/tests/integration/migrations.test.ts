import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { createServerModule } from '../../src/server/index.js';
import type { ServerModuleAdapter } from '../../src/server/types.js';

// Integration test: runs real migrations against an ephemeral Postgres.
// Requires DATABASE_URL env var (set by CI service container or local dev).

const DATABASE_URL = process.env.DATABASE_URL;

// Skip gracefully if no DB is available (unit-only runs)
const describeWithDb = DATABASE_URL ? describe : describe.skip;

describeWithDb('team-management migrations (integration)', () => {
  let pool: Pool;

  const testAdapter: ServerModuleAdapter = {
    getCurrentUserId: async () => 1,
    getOrganizationIdForUser: async () => 1,
    isUserOrgAdmin: async () => true,
    logger: {
      info: (msg) => process.stdout.write(`[info] ${msg}\n`),
      warn: (msg) => process.stdout.write(`[warn] ${msg}\n`),
      error: (msg) => process.stderr.write(`[error] ${msg}\n`),
    },
  };

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    // Clean up any leftover state from previous test runs
    await pool.query('DROP TABLE IF EXISTS tm_schema_migrations CASCADE');
  });

  afterAll(async () => {
    await pool.query('DROP TABLE IF EXISTS tm_schema_migrations CASCADE');
    await pool.end();
  });

  it('runMigrations() creates the tm_schema_migrations ledger table', async () => {
    const tm = createServerModule({
      adapter: testAdapter,
      db: pool,
      config: {},
    });

    const result = await tm.runMigrations();

    // The bootstrap migration should be applied
    expect(result.applied).toContain('0001_create_tm_schema_migrations');
    expect(result.skipped).toHaveLength(0);

    // Verify the table exists and has the ledger row
    const rows = await pool.query(
      "SELECT migration FROM tm_schema_migrations WHERE migration = '0001_create_tm_schema_migrations'"
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].migration).toBe('0001_create_tm_schema_migrations');
  });

  it('runMigrations() is idempotent — second call skips all migrations', async () => {
    const tm = createServerModule({
      adapter: testAdapter,
      db: pool,
      config: {},
    });

    const result = await tm.runMigrations();

    expect(result.applied).toHaveLength(0);
    expect(result.skipped).toContain('0001_create_tm_schema_migrations');
  });

  it('GET /health returns 200 with db: connected after migrations', async () => {
    const tm = createServerModule({
      adapter: testAdapter,
      db: pool,
      config: {},
    });

    // Invoke the health handler directly (no HTTP needed)
    const mockRes = {
      json: (body: unknown) => body,
      status: (_code: number) => ({ json: (body: unknown) => body }),
    } as unknown as import('express').Response;

    let responseBody: Record<string, unknown> | null = null;
    const capturingRes = {
      json: (body: Record<string, unknown>) => { responseBody = body; return mockRes; },
      status: (_code: number) => ({ json: (body: Record<string, unknown>) => { responseBody = body; } }),
    } as unknown as import('express').Response;

    await (tm.health as Function)({} as import('express').Request, capturingRes, () => {});

    expect(responseBody).not.toBeNull();
    expect((responseBody as Record<string, unknown>).status).toBe('ok');
    expect((responseBody as Record<string, unknown>).db).toBe('connected');
  });
});
