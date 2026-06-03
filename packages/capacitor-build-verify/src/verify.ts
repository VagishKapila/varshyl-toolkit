import { readFileSync, existsSync, statSync, readdirSync, utimesSync } from 'node:fs';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import type { BundleCheck, OnMissingFiles, Platform, VerifyConfig } from './config.js';
import { loadConfig, resolvePresetPlatforms, resolveSearchDirs } from './config.js';

export type CheckStatus = 'pass' | 'fail' | 'warn';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  details?: string[];
}

export interface VerifyOptions {
  cwd?: string;
  configPath?: string;
  preset?: 'capacitor-basic';
  enforceFreshSync?: boolean;
}

export interface VerifyReport {
  ok: boolean;
  results: CheckResult[];
}

const FRESH_SYNC_MAX_AGE_SEC = 60;
const DEFAULT_ANDROID_MANIFEST = 'android/app/src/main/AndroidManifest.xml';

function dirIsNonEmpty(absDir: string): boolean {
  if (!existsSync(absDir)) return false;
  return readdirSync(absDir).length > 0;
}

function readCapacitorConfigText(cwd: string): string | null {
  const candidates = ['capacitor.config.ts', 'capacitor.config.json'];
  for (const file of candidates) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) continue;
    return readFileSync(path, 'utf8');
  }
  return null;
}

function readWebDirFromCapacitorConfig(cwd: string): string | null {
  const text = readCapacitorConfigText(cwd);
  if (!text) return null;
  const match = text.match(/webDir\s*:\s*['"]([^'"]+)['"]/);
  if (match?.[1]) return match[1];
  try {
    const json = JSON.parse(text) as { webDir?: string };
    if (json.webDir) return json.webDir;
  } catch {
    /* not json */
  }
  return null;
}

function readAppIdFromCapacitorConfig(cwd: string): string | null {
  const text = readCapacitorConfigText(cwd);
  if (!text) return null;
  const match = text.match(/appId\s*:\s*['"]([^'"]+)['"]/);
  if (match?.[1]) return match[1];
  try {
    const json = JSON.parse(text) as { appId?: string };
    if (json.appId) return json.appId;
  } catch {
    /* not json */
  }
  return null;
}

function fileContainsAll(filePath: string, needles: string[]): string[] {
  const content = readFileSync(filePath, 'utf8');
  return needles.filter((n) => !content.includes(n));
}

function absoluteSearchDirs(cwd: string, config: VerifyConfig, platforms: BundleCheck['platforms']) {
  const relDirs = resolveSearchDirs(config, platforms);
  return relDirs.map(({ label, path }) => ({
    label,
    abs: resolve(cwd, path),
  }));
}

function runDirFreshnessCheck(
  dirLabel: string,
  configPath: string,
  absDir: string,
): CheckResult {
  if (!existsSync(absDir)) {
    return {
      name: `${dirLabel} dir recently synced`,
      status: 'fail',
      message: `${configPath} not found: ${absDir}`,
      details: [absDir],
    };
  }
  const mtimeMs = statSync(absDir).mtimeMs;
  const ageSec = (Date.now() - mtimeMs) / 1000;
  if (ageSec > FRESH_SYNC_MAX_AGE_SEC) {
    return {
      name: `${dirLabel} dir recently synced`,
      status: 'fail',
      message: `${configPath} last modified ${Math.round(ageSec)}s ago (max ${FRESH_SYNC_MAX_AGE_SEC}s with --enforce-fresh-sync)`,
      details: [absDir],
    };
  }
  return {
    name: `${dirLabel} dir recently synced`,
    status: 'pass',
    message: `${configPath} updated ${Math.round(ageSec)}s ago`,
    details: [absDir],
  };
}

function runNativeDirNonEmptyCheck(
  platformLabel: Platform,
  configKey: 'iosPublicDir' | 'androidAssetsDir',
  config: VerifyConfig,
  cwd: string,
): CheckResult {
  const relPath = config[configKey];
  const abs = resolve(cwd, relPath);
  const name =
    platformLabel === 'ios'
      ? 'iOS public directory exists'
      : 'Android assets directory exists';

  if (!existsSync(abs)) {
    return {
      name,
      status: 'fail',
      message: `${configKey} not found: ${abs}`,
      details: [abs],
    };
  }
  if (!dirIsNonEmpty(abs)) {
    return {
      name,
      status: 'fail',
      message: `${configKey} is empty: ${abs}`,
      details: [abs],
    };
  }
  return {
    name,
    status: 'pass',
    message: `${configKey} is present and non-empty: ${abs}`,
    details: [abs],
  };
}

function runAndroidManifestCheck(cwd: string): CheckResult {
  const manifestPath = resolve(cwd, DEFAULT_ANDROID_MANIFEST);
  if (!existsSync(manifestPath)) {
    return {
      name: 'AndroidManifest package matches appId',
      status: 'fail',
      message: `AndroidManifest.xml not found: ${manifestPath}`,
      details: [manifestPath],
    };
  }

  const appId = readAppIdFromCapacitorConfig(cwd);
  if (!appId) {
    return {
      name: 'AndroidManifest package matches appId',
      status: 'warn',
      message: 'Could not read appId from capacitor.config.ts/json — skipped',
    };
  }

  const manifest = readFileSync(manifestPath, 'utf8');
  const hasPackage = manifest.includes(`package="${appId}"`) || manifest.includes(`package='${appId}'`);
  if (!hasPackage) {
    return {
      name: 'AndroidManifest package matches appId',
      status: 'fail',
      message: `AndroidManifest.xml does not reference appId "${appId}"`,
      details: [manifestPath, `Expected package="${appId}"`],
    };
  }

  return {
    name: 'AndroidManifest package matches appId',
    status: 'pass',
    message: `AndroidManifest.xml references appId "${appId}"`,
    details: [manifestPath],
  };
}

async function runBundleCheck(
  cwd: string,
  config: VerifyConfig,
  check: BundleCheck,
  onMissingFiles: OnMissingFiles,
): Promise<CheckResult> {
  const details: string[] = [];
  let failed = false;

  for (const { label, abs } of absoluteSearchDirs(cwd, config, check.platforms)) {
    if (!existsSync(abs)) {
      const msg = `[${label}] directory missing: ${abs}`;
      if (onMissingFiles === 'warn') {
        details.push(`WARN: ${msg}`);
      } else {
        details.push(`FAIL: ${msg}`);
        failed = true;
      }
      continue;
    }

    for (const pattern of check.globs) {
      const files = await fg(pattern, { cwd: abs, absolute: true, onlyFiles: true });
      if (files.length === 0) {
        const msg = `[${label}] glob "${pattern}" matched no files under ${abs}`;
        if (onMissingFiles === 'warn') {
          details.push(`WARN: ${msg}`);
        } else {
          details.push(`FAIL: ${msg}`);
          failed = true;
        }
        continue;
      }

      for (const file of files) {
        const missing = fileContainsAll(file, check.mustContain);
        if (missing.length > 0) {
          details.push(
            `FAIL: [${label}] ${file} missing: ${missing.map((s) => JSON.stringify(s)).join(', ')}`,
          );
          failed = true;
        } else {
          details.push(`PASS: [${label}] ${file}`);
        }
      }
    }
  }

  return {
    name: check.name,
    status: failed ? 'fail' : 'pass',
    message: failed ? 'One or more paths failed content checks' : 'All paths contain required strings',
    details,
  };
}

function runPresetBasic(cwd: string, config: VerifyConfig, enforceFreshSync: boolean): CheckResult[] {
  const results: CheckResult[] = [];
  const platforms = resolvePresetPlatforms(config);
  const exportAbs = resolve(cwd, config.exportDir);

  if (!existsSync(exportAbs)) {
    results.push({
      name: 'Static export directory exists',
      status: 'fail',
      message: `exportDir not found: ${exportAbs}`,
    });
  } else if (!dirIsNonEmpty(exportAbs)) {
    results.push({
      name: 'Static export directory exists',
      status: 'fail',
      message: `exportDir is empty: ${exportAbs}`,
    });
  } else {
    results.push({
      name: 'Static export directory exists',
      status: 'pass',
      message: `exportDir is present and non-empty: ${exportAbs}`,
    });
  }

  const webDir = readWebDirFromCapacitorConfig(cwd);
  if (webDir === null) {
    results.push({
      name: 'capacitor.config webDir matches exportDir',
      status: 'warn',
      message: 'Could not read webDir from capacitor.config.ts/json — skipped',
    });
  } else if (webDir !== config.exportDir) {
    results.push({
      name: 'capacitor.config webDir matches exportDir',
      status: 'fail',
      message: `webDir is "${webDir}" but exportDir is "${config.exportDir}"`,
    });
  } else {
    results.push({
      name: 'capacitor.config webDir matches exportDir',
      status: 'pass',
      message: `webDir matches exportDir ("${config.exportDir}")`,
    });
  }

  if (platforms.includes('ios')) {
    results.push(runNativeDirNonEmptyCheck('ios', 'iosPublicDir', config, cwd));
  }

  if (platforms.includes('android')) {
    results.push(runNativeDirNonEmptyCheck('android', 'androidAssetsDir', config, cwd));

    const verifyManifest = config.verifyAndroidManifest !== false;
    if (verifyManifest) {
      results.push(runAndroidManifestCheck(cwd));
    }
  }

  if (enforceFreshSync) {
    if (platforms.includes('ios')) {
      results.push(
        runDirFreshnessCheck('iOS public', 'iosPublicDir', resolve(cwd, config.iosPublicDir)),
      );
    }
    if (platforms.includes('android')) {
      results.push(
        runDirFreshnessCheck(
          'Android assets',
          'androidAssetsDir',
          resolve(cwd, config.androidAssetsDir),
        ),
      );
    }
  }

  return results;
}

export async function runVerify(options: VerifyOptions = {}): Promise<VerifyReport> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig(cwd, options.configPath);
  const onMissingFiles = config.onMissingFiles ?? 'fail';
  const results: CheckResult[] = [];

  if (options.preset === 'capacitor-basic') {
    results.push(...runPresetBasic(cwd, config, options.enforceFreshSync ?? false));
  }

  for (const check of config.checks) {
    results.push(await runBundleCheck(cwd, config, check, onMissingFiles));
  }

  const ok = results.every((r) => r.status !== 'fail');
  return { ok, results };
}

export function formatHuman(report: VerifyReport): string {
  const lines: string[] = [];
  for (const r of report.results) {
    const icon = r.status === 'pass' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
    lines.push(`${icon} ${r.name}: ${r.message}`);
    if (r.details?.length) {
      for (const d of r.details) {
        lines.push(`    ${d}`);
      }
    }
  }
  lines.push('');
  lines.push(report.ok ? 'All checks passed.' : 'One or more checks failed.');
  return lines.join('\n');
}

/** Test helper: touch a directory so --enforce-fresh-sync passes. */
export function touchDirForFreshSync(absDir: string): void {
  const now = Date.now() / 1000;
  utimesSync(absDir, now, now);
}

/** Test helper: age a directory so --enforce-fresh-sync fails. */
export function ageDirForStaleSync(absDir: string, ageSec = 120): void {
  const old = (Date.now() - ageSec * 1000) / 1000;
  utimesSync(absDir, old, old);
}
