// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(fileURLToPath(import.meta.url), '../..');

describe('main barrel bundle guard', () => {
  it('dist/index.js does not bundle express', () => {
    const source = readFileSync(join(pkgRoot, 'dist/index.js'), 'utf8');
    expect(source).not.toMatch(/from ['"]express['"]/);
    expect(source).not.toMatch(/require\(['"]express['"]\)/);
  });

  it('dist/index.js does not reference createSorenRouter', () => {
    const source = readFileSync(join(pkgRoot, 'dist/index.js'), 'utf8');
    expect(source).not.toMatch(/createSorenRouter/);
  });
});
