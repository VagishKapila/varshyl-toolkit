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
const GEO_AUDIT_ENDPOINT =
  process.env.GEO_AUDIT_ENDPOINT
  ?? 'https://toolkit-demo-host-production-ac14.up.railway.app/api/geo-audit';

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

interface LiveAuditCheck {
  name: string;
  points: number;
  maxPoints: number;
  tip: string;
  category?: string;
}

interface LiveAuditSnapshot {
  score: number;
  checks: LiveAuditCheck[];
}

export function buildAuditFromScan(
  url: string,
  platform: Platform,
  failingChecks: { name: string; tip: string }[],
  liveAudit?: LiveAuditSnapshot | null,
): GeoAudit {
  const byName = new Map(liveAudit?.checks.map((c) => [c.name, c]) ?? []);
  const checks: GeoAuditCheck[] = failingChecks.map((fc) => ({
    name: fc.name,
    passed: false,
    points: byName.get(fc.name)?.points ?? 0,
    maxPoints: byName.get(fc.name)?.maxPoints ?? (CHECK_POINTS[fc.name] ?? 0),
    tip: byName.get(fc.name)?.tip ?? fc.tip,
    category: byName.get(fc.name)?.category ?? categoryForCheckName(fc.name),
  }));
  const scoreFromFailedOnly = Math.max(
    0,
    Math.round(
      (
        (SCORABLE_MAX_POINTS - checks.reduce((sum, c) => sum + (c.maxPoints - c.points), 0))
        / SCORABLE_MAX_POINTS
      ) * 100,
    ),
  );

  return {
    url,
    score: liveAudit?.score ?? scoreFromFailedOnly,
    platform,
    checks,
  };
}

async function fetchLiveAuditSnapshot(url: string): Promise<LiveAuditSnapshot | null> {
  try {
    const res = await fetch(GEO_AUDIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      score?: unknown;
      checks?: unknown;
    };
    if (typeof data.score !== 'number' || !Array.isArray(data.checks)) return null;
    const checks = data.checks
      .filter((raw): raw is LiveAuditCheck => {
        const c = raw as Partial<LiveAuditCheck>;
        return (
          typeof c.name === 'string'
          && typeof c.points === 'number'
          && typeof c.maxPoints === 'number'
          && typeof c.tip === 'string'
        );
      });
    return { score: data.score, checks };
  } catch {
    return null;
  }
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
  const liveAudit = await fetchLiveAuditSnapshot(baseUrl);
  const audit = buildAuditFromScan(baseUrl, body.platform, body.failingChecks, liveAudit);
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
