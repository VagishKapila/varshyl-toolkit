import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distMain = join(pkgRoot, 'dist/index.cjs');

if (!existsSync(distMain)) {
  execSync('pnpm --filter @varshylinc/geo build', { cwd: pkgRoot, stdio: 'pipe' });
}

describe('bundled output', () => {
  test('main barrel has no react imports', () => {
    const bundle = readFileSync(distMain, 'utf8');
    expect(bundle).not.toMatch(/require\('react'\)/);
  });

  test('VERSION is 0.1.0', () => {
    expect(require('../dist/index.cjs').VERSION).toBe('0.1.0');
  });
});
