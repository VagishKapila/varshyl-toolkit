import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const pkgRoot = join(fileURLToPath(import.meta.url), '../..');

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('bundled dist (tsup) — no fs migration IO', () => {
  it('inlines SQL into the bundle (readFileSync absent)', () => {
    execSync('pnpm exec tsx scripts/inline-migrations.ts', { cwd: pkgRoot, stdio: 'pipe' });
    const outDir = join(pkgRoot, 'dist-bundled-verify');
    execSync(
      `pnpm exec tsup src/index.ts --format esm --platform node --target node20 --out-dir ${outDir} --clean --no-splitting`,
      { cwd: pkgRoot, stdio: 'pipe' },
    );
    const bundleSource = readFileSync(join(outDir, 'index.js'), 'utf8');
    expect(bundleSource).not.toMatch(/readFileSync|from ['"]fs['"]/);
    expect(bundleSource).toMatch(/CREATE TABLE IF NOT EXISTS tm_schema_migrations/);
  });
});

const describeWithPostgres = isDockerAvailable() ? describe : describe.skip;

describeWithPostgres('bundled dist (tsup) — migrations + self-test', () => {
  const bundleDir = mkdtempSync(join(tmpdir(), 'tm-bundled-'));
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    execSync('pnpm exec tsx scripts/inline-migrations.ts', { cwd: pkgRoot, stdio: 'inherit' });
    execSync(
      `pnpm exec tsup src/index.ts --format esm --platform node --target node20 --out-dir ${bundleDir} --clean --no-splitting`,
      { cwd: pkgRoot, stdio: 'inherit' },
    );

    const bundleSource = readFileSync(join(bundleDir, 'index.js'), 'utf8');
    expect(bundleSource).not.toMatch(/readFileSync/);
    expect(bundleSource).toMatch(/tm_schema_migrations/);

    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
    rmSync(bundleDir, { recursive: true, force: true });
  });

  it('runs bundled migrations and verifies schema', async () => {
    const bundleUrl = pathToFileURL(join(bundleDir, 'index.js')).href;
    const mod = await import(bundleUrl);

    expect(mod.runMigrations).toBeTypeOf('function');
    expect(mod.tmSelfTest).toBeTypeOf('function');

    const selfTest = await mod.tmSelfTest({ pool });
    expect(selfTest.migrationsOk).toBe(true);
    expect(selfTest.migrationsInLedger).toBe(12);
    expect(selfTest.organizationsTableExists).toBe(true);
  }, 30_000);
});
