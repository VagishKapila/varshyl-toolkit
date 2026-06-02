import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const componentsDir = join(pkgRoot, 'dist/client/components');

describe('dist client CSS (npm publish)', () => {
  it('includes SocialButtons.css and AuthDivider.css after build', () => {
    expect(existsSync(join(componentsDir, 'SocialButtons.css'))).toBe(true);
    expect(existsSync(join(componentsDir, 'AuthDivider.css'))).toBe(true);
  });
});
