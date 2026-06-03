import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runVerify } from '../src/verify.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => join(here, 'fixtures', name);

describe('runVerify', () => {
  it('passes when all mustContain strings are present', async () => {
    const report = await runVerify({
      cwd: fixture('pass'),
      configPath: '.varshyl-cap-verify.json',
    });
    expect(report.ok).toBe(true);
    expect(report.results.some((r) => r.name.includes('Danger Zone'))).toBe(true);
  });

  it('fails when a required string is missing from bundle files', async () => {
    const report = await runVerify({
      cwd: fixture('fail-missing-string'),
      configPath: '.varshyl-cap-verify.json',
    });
    expect(report.ok).toBe(false);
    const check = report.results.find((r) => r.name.includes('Danger Zone'));
    expect(check?.status).toBe('fail');
    expect(check?.details?.some((d) => d.includes('Danger zone'))).toBe(true);
  });

  it('fails with clear error when exportDir does not exist (preset)', async () => {
    const report = await runVerify({
      cwd: fixture('no-export'),
      preset: 'capacitor-basic',
    });
    expect(report.ok).toBe(false);
    expect(report.results[0]?.message).toMatch(/exportDir not found/);
  });

  it('runs capacitor-basic preset when export exists', async () => {
    const report = await runVerify({
      cwd: fixture('pass'),
      preset: 'capacitor-basic',
    });
    expect(report.results.find((r) => r.name === 'Static export directory exists')?.status).toBe(
      'pass',
    );
    expect(
      report.results.find((r) => r.name === 'capacitor.config webDir matches exportDir')?.status,
    ).toBe('pass');
  });
});
