#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runVerify, formatHuman } from './verify.js';

function printUsage(): void {
  console.error(`Usage: varshyl-cap-verify [options]

Options:
  --config <path>           Config file (default: .varshyl-cap-verify.json)
  --preset capacitor-basic  Run built-in export / webDir / freshness checks
  --enforce-fresh-sync      Require ios public dir modified within 60s (with preset)
  --format human|json       Output format (default: human)
  --cwd <dir>               Working directory (default: process.cwd())
  -h, --help                Show this help
`);
}

function parseArgs(argv: string[]) {
  let configPath: string | undefined;
  let preset: 'capacitor-basic' | undefined;
  let enforceFreshSync = false;
  let format: 'human' | 'json' = 'human';
  let cwd = process.cwd();
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '--config') {
      configPath = argv[++i];
    } else if (arg === '--preset') {
      const value = argv[++i];
      if (value !== 'capacitor-basic') {
        throw new Error(`Unknown preset: ${value}`);
      }
      preset = value;
    } else if (arg === '--enforce-fresh-sync') {
      enforceFreshSync = true;
    } else if (arg === '--format') {
      const value = argv[++i];
      if (value !== 'human' && value !== 'json') {
        throw new Error(`Unknown format: ${value}`);
      }
      format = value;
    } else if (arg === '--cwd') {
      cwd = argv[++i] ?? cwd;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { configPath, preset, enforceFreshSync, format, cwd, help };
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      printUsage();
      process.exit(0);
    }

    const defaultConfig = resolve(args.cwd, '.varshyl-cap-verify.json');
    const hasDefaultConfig = existsSync(defaultConfig);
    if (!args.preset && !args.configPath && !hasDefaultConfig) {
      console.error(
        'No .varshyl-cap-verify.json found. Pass --config or --preset capacitor-basic.',
      );
      process.exit(1);
    }

    const report = await runVerify({
      cwd: args.cwd,
      configPath: args.configPath,
      preset: args.preset,
      enforceFreshSync: args.enforceFreshSync,
    });

    if (args.format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatHuman(report));
    }

    process.exit(report.ok ? 0 : 1);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

void main();
