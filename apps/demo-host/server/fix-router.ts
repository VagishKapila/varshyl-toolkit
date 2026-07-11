import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { Platform } from './platform-detector.js';
import {
  buildZipBuffer,
  CHECK_POINTS,
  categoryForCheckName,
  SCORABLE_MAX_POINTS,
  extractSiteMetadata,
  generateFixPackage,
  type GeoAudit,
  type GeoAuditCheck,
} from './fix-generator/index.js';

const router: Router = Router();

const zipCache = new Map<string, { buffer: Buffer; expiresAt: number }>();
const ZIP_TTL_MS = 15 * 60 * 1000;

function cors(res: import('express').Response): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
}

function normalizeUrl(raw: string): string | null {
  try {
    const value = raw.trim();
    if (!/^https?:\/\//i.test(value)) return null;
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${path === '' ? '' : path}`;
  } catch {
    return null;
  }
}

async function fetchSiteHtml(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Cannot fetch ${url}: ${res.status}`);
  return res.text();
}

function buildAudit(
  url: string,
  platform: Platform,
  failingChecks: { name: string; tip: string }[],
): GeoAudit {
  const checks: GeoAuditCheck[] = failingChecks.map((fc) => ({
    name: fc.name,
    passed: false,
    points: 0,
    maxPoints: CHECK_POINTS[fc.name] ?? 0,
    tip: fc.tip,
    category: categoryForCheckName(fc.name),
  }));
  const lost = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const total = SCORABLE_MAX_POINTS;
  return {
    url,
    score: Math.max(0, Math.round(((total - lost) / total) * 100)),
    platform,
    checks,
  };
}

interface FixRequestBody {
  platform: Platform;
  failingChecks: { name: string; tip: string }[];
  siteInfo: { url: string };
  tier?: 'diy' | 'ai';
}

async function buildFixResponse(body: FixRequestBody, tier: 'diy' | 'ai') {
  const baseUrl = normalizeUrl(body.siteInfo.url);
  if (!baseUrl) throw new Error('Invalid siteInfo.url');

  const html = await fetchSiteHtml(baseUrl);
  const siteMetadata = extractSiteMetadata(html, baseUrl, body.platform);
  const audit = buildAudit(baseUrl, body.platform, body.failingChecks);
  const generated = generateFixPackage({ audit, siteMetadata });

  const zipEntries = [
    { filename: 'README.md', content: generated.readme },
    ...generated.files.map((f) => ({ filename: f.filename, content: f.content })),
  ];
  if (tier === 'ai') {
    zipEntries.push({ filename: 'PROMPT.txt', content: generated.prompt });
  }

  const zipBuffer = await buildZipBuffer(zipEntries);
  const zipId = randomUUID();
  zipCache.set(zipId, { buffer: zipBuffer, expiresAt: Date.now() + ZIP_TTL_MS });

  const files = [
    ...generated.files.map((f) => ({
      filename: f.filename,
      content: f.content,
      description: `Fixes ${f.check} (+${f.pointsRecovered} pts)`,
    })),
    {
      filename: 'README.md',
      content: generated.readme,
      description: 'Install guide for this repair package',
    },
  ];
  if (tier === 'ai') {
    files.push({
      filename: 'PROMPT.txt',
      content: generated.prompt,
      description: 'Paste into ChatGPT or Claude',
    });
  }

  return {
    platform: body.platform,
    summary: `Repair package with ${generated.files.length} fix file(s)`,
    files,
    readme: generated.readme,
    prompt: tier === 'ai' ? generated.prompt : undefined,
    zipUrl: `/api/soren/fix/download/${zipId}`,
    instructions: [],
    sorenSays:
      'Your repair package is ready. Apply the files, then re-run the scan.',
    creditsRequired: 5,
  };
}

router.options('/', (_req, res) => {
  cors(res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

router.post('/', async (req, res) => {
  cors(res);

  const body = req.body as FixRequestBody;
  const tier =
    (req.query.tier as string | undefined) === 'ai' || body.tier === 'ai'
      ? 'ai'
      : 'diy';

  if (!body.platform || !body.failingChecks?.length || !body.siteInfo?.url) {
    res.status(400).json({
      error: 'platform, failingChecks, and siteInfo.url required',
    });
    return;
  }

  try {
    const payload = await buildFixResponse(body, tier);
    res.json(payload);
  } catch (err) {
    console.error('Fix generator error:', err);
    res.status(500).json({ error: 'Fix generation failed' });
  }
});

router.get('/download/:id', (req, res) => {
  cors(res);
  const entry = zipCache.get(req.params.id);
  if (!entry || entry.expiresAt < Date.now()) {
    res.status(404).json({ error: 'ZIP not found or expired' });
    return;
  }
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="soren-fix-package.zip"`,
  );
  res.send(entry.buffer);
});

router.options('/ai-package', (_req, res) => {
  cors(res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

router.post('/ai-package', async (req, res) => {
  cors(res);

  const body = req.body as FixRequestBody;
  if (!body.platform || !body.failingChecks?.length || !body.siteInfo?.url) {
    res.status(400).json({
      error: 'platform, failingChecks, siteInfo required',
    });
    return;
  }

  try {
    const payload = await buildFixResponse(body, 'ai');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="soren-fix-${body.platform}.txt"`,
    );
    res.send(payload.prompt ?? '');
  } catch (err) {
    console.error('AI package error:', err);
    res.status(500).json({ error: 'AI package generation failed' });
  }
});

export default router;
