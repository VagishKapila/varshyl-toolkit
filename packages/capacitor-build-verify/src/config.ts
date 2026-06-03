import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type Platform = 'ios' | 'android';
export type OnMissingFiles = 'fail' | 'warn';

export interface BundleCheck {
  name: string;
  globs: string[];
  mustContain: string[];
  platforms: Platform[];
}

export interface VerifyConfig {
  exportDir: string;
  iosPublicDir: string;
  androidAssetsDir: string;
  onMissingFiles?: OnMissingFiles;
  checks: BundleCheck[];
}

const DEFAULT_CONFIG: VerifyConfig = {
  exportDir: 'out',
  iosPublicDir: 'ios/App/App/public',
  androidAssetsDir: 'android/app/src/main/assets/public',
  onMissingFiles: 'fail',
  checks: [],
};

export function loadConfig(cwd: string, configPath?: string): VerifyConfig {
  const path = resolve(cwd, configPath ?? '.varshyl-cap-verify.json');
  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<VerifyConfig>;
  return {
    exportDir: raw.exportDir ?? DEFAULT_CONFIG.exportDir,
    iosPublicDir: raw.iosPublicDir ?? DEFAULT_CONFIG.iosPublicDir,
    androidAssetsDir: raw.androidAssetsDir ?? DEFAULT_CONFIG.androidAssetsDir,
    onMissingFiles: raw.onMissingFiles ?? DEFAULT_CONFIG.onMissingFiles,
    checks: raw.checks ?? [],
  };
}

export function resolveSearchDirs(
  config: VerifyConfig,
  platforms: Platform[],
): { label: string; path: string }[] {
  const dirs: { label: string; path: string }[] = [
    { label: 'export', path: config.exportDir },
  ];
  if (platforms.includes('ios')) {
    dirs.push({ label: 'ios', path: config.iosPublicDir });
  }
  if (platforms.includes('android')) {
    dirs.push({ label: 'android', path: config.androidAssetsDir });
  }
  return dirs;
}
