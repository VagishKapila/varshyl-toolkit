// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(fileURLToPath(import.meta.url), '../..');

describe('main barrel bundle guard', () => {
  it('main barrel has no react or capacitor imports', () => {
    const bundle = readFileSync(join(pkgRoot, 'dist/index.cjs'), 'utf8');
    expect(bundle).not.toMatch(/require\('react'\)/);
    expect(bundle).not.toMatch(/capacitor/i);
  });

  it('main barrel exports VERSION', () => {
    const m = require('../dist/index.cjs') as {
      VERSION: string;
      DEFAULT_MAX_UPLOAD_BYTES: number;
    };
    expect(m.VERSION).toBe('0.1.0');
    expect(m.DEFAULT_MAX_UPLOAD_BYTES).toBe(26214400);
  });

  it('./providers exports getAvailableProviders', () => {
    const p = require('../dist/providers.cjs') as {
      getAvailableProviders: (platform?: string) => unknown;
      detectProviderFromUrl: (url: string) => string;
      detectFileTypeFromUrl: (url: string) => string;
    };
    expect(typeof p.getAvailableProviders).toBe('function');
    expect(typeof p.detectProviderFromUrl).toBe('function');
    expect(typeof p.detectFileTypeFromUrl).toBe('function');
  });
});
