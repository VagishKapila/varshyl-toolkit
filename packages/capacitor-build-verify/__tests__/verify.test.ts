import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ageDirForStaleSync, runVerify, touchDirForFreshSync } from '../src/verify.js';

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

  it('passes android bundle globs under androidAssetsDir', async () => {
    const cwd = fixture('android-pass');
    const report = await runVerify({
      cwd,
      configPath: '.varshyl-cap-verify.json',
    });
    expect(report.ok).toBe(true);
    expect(report.results.some((r) => r.details?.some((d) => d.includes('[android]')))).toBe(
      true,
    );
  });

  it('runs capacitor-basic android preset (assets + manifest)', async () => {
    const cwd = fixture('android-pass');
    const report = await runVerify({
      cwd,
      preset: 'capacitor-basic',
      configPath: '.varshyl-cap-verify.json',
    });
    expect(
      report.results.find((r) => r.name === 'Android assets directory exists')?.status,
    ).toBe('pass');
    expect(
      report.results.find((r) => r.name === 'AndroidManifest package matches appId')?.status,
    ).toBe('pass');
  });

  it('fails --enforce-fresh-sync when androidAssetsDir is stale', async () => {
    const cwd = fixture('android-stale-sync');
    const androidAssets = join(cwd, 'android/app/src/main/assets/public');
    ageDirForStaleSync(androidAssets, 120);

    const report = await runVerify({
      cwd,
      preset: 'capacitor-basic',
      configPath: '.varshyl-cap-verify.json',
      enforceFreshSync: true,
    });

    expect(report.ok).toBe(false);
    const fresh = report.results.find((r) => r.name === 'Android assets dir recently synced');
    expect(fresh?.status).toBe('fail');
    expect(fresh?.message).toMatch(/androidAssetsDir/);
    expect(fresh?.details?.[0]).toContain('android/app/src/main/assets/public');
  });

  it('passes --enforce-fresh-sync when androidAssetsDir was just synced', async () => {
    const cwd = fixture('android-pass');
    touchDirForFreshSync(join(cwd, 'android/app/src/main/assets/public'));

    const report = await runVerify({
      cwd,
      preset: 'capacitor-basic',
      configPath: '.varshyl-cap-verify.json',
      enforceFreshSync: true,
    });

    expect(
      report.results.find((r) => r.name === 'Android assets dir recently synced')?.status,
    ).toBe('pass');
  });
});
