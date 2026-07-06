#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { GEO } from '../index.js';
import type { GEOConfig } from '../types.js';

function parseFlag(name: string, args: string[]): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
}

function placeholderConfig(url = 'https://example.com'): GEOConfig {
  return {
    product: {
      name: 'Your Product',
      tagline: 'A crisp one-line value proposition',
      url,
      type: 'WebApplication',
      category: 'Productivity',
      features: ['Feature one', 'Feature two', 'Feature three'],
      problems_solved: ['Problem one', 'Problem two'],
    },
    company: {
      name: 'Your Company',
      url,
      location: 'Global',
    },
    founder: {
      name: 'Founder Name',
      title: 'Founder',
      url,
    },
  };
}

async function cmdInit(args: string[]): Promise<void> {
  const url = parseFlag('--url', args);
  const geo = new GEO(placeholderConfig(url));
  await writeFile('llms.txt', geo.llmsTxt(), 'utf8');
  await writeFile('robots.txt', geo.robotsTxt(), 'utf8');
  console.log('Created llms.txt and robots.txt in current directory.');
}

async function cmdAudit(): Promise<void> {
  const checks = [
    { label: 'llms.txt exists', ok: await exists('llms.txt') },
    { label: 'robots.txt exists', ok: await exists('robots.txt') },
    { label: 'sitemap.xml exists', ok: await exists('sitemap.xml') },
    { label: 'geo.jsonld.json exists', ok: await exists('geo.jsonld.json') },
    { label: 'appstore.txt exists', ok: await exists('appstore.txt') },
  ];
  if (checks[0].ok) checks.push({ label: 'llms.txt includes product section', ok: await has('llms.txt', '## What this product does') });
  if (checks[1].ok) checks.push({ label: 'robots.txt includes GPTBot + ClaudeBot', ok: (await has('robots.txt', 'GPTBot')) && (await has('robots.txt', 'ClaudeBot')) });
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  for (const check of checks) console.log(`${check.ok ? '✅' : '❌'} ${check.label}`);
  console.log(`Score: ${score}/100`);
}

async function cmdAppStore(): Promise<void> {
  const rl = createInterface({ input, output });
  const name = await rl.question('Product name: ');
  const tagline = await rl.question('Tagline: ');
  const f1 = await rl.question('Feature 1: ');
  const f2 = await rl.question('Feature 2: ');
  const f3 = await rl.question('Feature 3: ');
  rl.close();
  const geo = new GEO({
    product: {
      name: name || 'Your Product',
      tagline: tagline || 'Your value proposition',
      url: 'https://example.com',
      type: 'WebApplication',
      category: 'Productivity',
      features: [f1, f2, f3].filter(Boolean),
      problems_solved: ['Problem one', 'Problem two'],
    },
    company: { name: 'Your Company', url: 'https://example.com' },
  });
  console.log(geo.appStoreDescription());
}

async function cmdValidate(args: string[]): Promise<void> {
  const target = args[0];
  if (!target) throw new Error('Usage: varshyl-geo validate <url>');
  const html = await fetch(target).then((r) => r.text());
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (matches.length === 0) throw new Error('No JSON-LD script found on target URL.');
  let parsed = 0;
  for (const m of matches) {
    try {
      JSON.parse(m[1] ?? '');
      parsed++;
    } catch {
      // Keep scanning all scripts to report total valid blocks.
    }
  }
  if (parsed === 0) throw new Error('JSON-LD scripts found, but none were valid JSON.');
  console.log(`Valid JSON-LD blocks: ${parsed}/${matches.length}`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path, 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function has(path: string, snippet: string): Promise<boolean> {
  try {
    return (await readFile(path, 'utf8')).includes(snippet);
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    console.log('Usage: varshyl-geo <init|audit|appstore|validate> [args]');
    return;
  }
  if (command === 'init') return cmdInit(rest);
  if (command === 'audit') return cmdAudit();
  if (command === 'appstore') return cmdAppStore();
  if (command === 'validate') return cmdValidate(rest);
  throw new Error(`Unknown command: ${command}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
