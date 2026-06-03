import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import fg from 'fast-glob';
import type { BundleCheck, OnMissingFiles, VerifyConfig } from './config.js';
import { loadConfig, resolveSearchDirs } from './config.js';

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

function dirIsNonEmpty(absDir: string): boolean {
  if (!existsSync(absDir)) return false;
  return readdirSync(absDir).length > 0;
}

function readWebDirFromCapacitorConfig(cwd: string): string | null {
  const candidates = ['capacitor.config.ts', 'capacitor.config.json'];
  for (const file of candidates) {
    const path = resolve(cwd, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    const match = text.match(/webDir\s*:\s*['"]([^'"]+)['"]/);
    if (match?.[1]) return match[1];
    if (file.endsWith('.json')) {
      try {
        const json = JSON.parse(text) as { webDir?: string };
        if (json.webDir) return json.webDir;
      } catch {
        /* ignore */
      }
    }
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

  if (enforceFreshSync) {
    const iosPublic = resolve(cwd, config.iosPublicDir);
    if (!existsSync(iosPublic)) {
      results.push({
        name: 'iOS public dir recently synced',
        status: 'fail',
        message: `iosPublicDir not found: ${iosPublic}`,
      });
    } else {
      const mtimeMs = statSync(iosPublic).mtimeMs;
      const ageSec = (Date.now() - mtimeMs) / 1000;
      if (ageSec > 60) {
        results.push({
          name: 'iOS public dir recently synced',
          status: 'fail',
          message: `iosPublicDir last modified ${Math.round(ageSec)}s ago (max 60s with --enforce-fresh-sync)`,
          details: [iosPublic],
        });
      } else {
        results.push({
          name: 'iOS public dir recently synced',
          status: 'pass',
          message: `iosPublicDir updated ${Math.round(ageSec)}s ago`,
          details: [iosPublic],
        });
      }
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
