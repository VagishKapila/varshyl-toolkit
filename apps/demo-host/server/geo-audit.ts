import { Router } from 'express';
import { detectPlatform } from './platform-detector.js';
import {
  AI_CATEGORY,
  buildAccessibilityChecks,
  buildSecurityChecks,
  scoreFromChecks,
  type AuditCheckResult,
} from './geo-audit-checks.js';
import {
  buildAuditComparison,
  gradeFromScore,
  parseCompareQuery,
  type AuditComparison,
  type PreviousCheckSnapshot,
} from './geo-audit-comparison.js';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

type AuditCheck = AuditCheckResult;

interface GeoAuditResult {
  url: string;
  score: number;
  grade: Grade;
  checks: AuditCheck[];
  topFixes: string[];
  installCommand: 'pnpm add @varshylinc/geo';
  platform: string;
  platformConfidence: string;
  platformSignals: string[];
  fixApproach: string;
  comparison?: AuditComparison;
}

interface JsonLdNode {
  ['@type']?: string | string[];
  ['@graph']?: JsonLdNode[];
}

function toBaseUrl(input: string): string | null {
  try {
    const value = input.trim();
    if (!/^https?:\/\//i.test(value)) return null;
    const parsed = new URL(value);
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${path === '' ? '' : path}`;
  } catch {
    return null;
  }
}

function withTimeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

function safeIncludes(source: string, fragment: string): boolean {
  return source.toLowerCase().includes(fragment.toLowerCase());
}

function parseJsonLdTypes(html: string): string[] {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const types: string[] = [];
  for (const match of html.matchAll(scriptRegex)) {
    try {
      const raw = (match[1] ?? '').trim();
      if (!raw) continue;
      const json = JSON.parse(raw) as JsonLdNode | JsonLdNode[];
      const queue: JsonLdNode[] = Array.isArray(json) ? [...json] : [json];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        const value = node['@type'];
        if (typeof value === 'string') types.push(value);
        if (Array.isArray(value)) {
          for (const v of value) if (typeof v === 'string') types.push(v);
        }
        if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
      }
    } catch {
      // Ignore invalid JSON-LD blocks, continue scanning.
    }
  }
  return types;
}

export default function createGeoAuditRouter(): Router {
  const router = Router();

  router.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  router.options('/', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
  });

  router.post('/', async (req, res) => {
    const body = req.body as {
      url?: unknown;
      previousChecks?: PreviousCheckSnapshot[];
    };
    if (typeof body?.url !== 'string') {
      res.status(400).json({ error: 'url must be a string' });
      return;
    }

    const baseUrl = toBaseUrl(body.url);
    if (!baseUrl) {
      res.status(400).json({ error: 'Invalid URL. Must start with http:// or https://' });
      return;
    }

    let pageHtml = '';
    let pageResponse: Response | null = null;
    try {
      pageResponse = await fetch(baseUrl, { signal: withTimeoutSignal(10_000) });
      if (!pageResponse.ok) {
        res.status(502).json({ error: 'Cannot reach URL' });
        return;
      }
      pageHtml = await pageResponse.text();
    } catch {
      res.status(502).json({ error: 'Cannot reach URL' });
      return;
    }

    const headers: Record<string, string> = {};
    pageResponse.headers.forEach((v, k) => {
      headers[k] = v;
    });

    const platformResult = detectPlatform(pageHtml, headers);

    const checks: AuditCheck[] = [];

    const llmsCheck: AuditCheck = {
      name: 'llms.txt',
      passed: false,
      points: 0,
      maxPoints: 20,
      tip: 'Publish /llms.txt with product, problem, and key-facts sections.',
      category: AI_CATEGORY,
    };
    try {
      const llmsRes = await fetch(`${baseUrl}/llms.txt`, { signal: withTimeoutSignal(10_000) });
      if (llmsRes.status === 200) {
        llmsCheck.passed = true;
        llmsCheck.points = 20;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(llmsCheck);

    const robotsCheck: AuditCheck = {
      name: 'robots.txt AI crawlers',
      passed: false,
      points: 0,
      maxPoints: 15,
      tip: 'Allow GPTBot, ClaudeBot, PerplexityBot, and anthropic-ai in robots.txt.',
      category: AI_CATEGORY,
    };
    try {
      const robotsRes = await fetch(`${baseUrl}/robots.txt`, { signal: withTimeoutSignal(10_000) });
      if (robotsRes.status === 200) {
        const robots = await robotsRes.text();
        const requiredBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'anthropic-ai'];
        const present = requiredBots.filter((bot) => safeIncludes(robots, bot)).length;
        if (present === requiredBots.length) {
          robotsCheck.passed = true;
          robotsCheck.points = 15;
        } else if (present > 0) {
          robotsCheck.points = 7;
        }
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(robotsCheck);

    const jsonLdCheck: AuditCheck = {
      name: 'JSON-LD script',
      passed: false,
      points: 0,
      maxPoints: 15,
      tip: 'Add <script type="application/ld+json"> with structured product metadata.',
      category: AI_CATEGORY,
    };
    try {
      if (/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(pageHtml)) {
        jsonLdCheck.passed = true;
        jsonLdCheck.points = 15;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(jsonLdCheck);

    const ogCheck: AuditCheck = {
      name: 'Open Graph tags',
      passed: false,
      points: 0,
      maxPoints: 10,
      tip: 'Include og:title, og:description, og:image, and og:url meta tags.',
      category: AI_CATEGORY,
    };
    try {
      const requiredOg = ['og:title', 'og:description', 'og:image', 'og:url'];
      const ogPresent = requiredOg.filter((name) =>
        new RegExp(`<meta[^>]*property=["']${name}["'][^>]*>`, 'i').test(pageHtml),
      ).length;
      if (ogPresent === requiredOg.length) {
        ogCheck.passed = true;
        ogCheck.points = 10;
      } else if (ogPresent > 0) {
        ogCheck.points = 5;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(ogCheck);

    const twitterCheck: AuditCheck = {
      name: 'Twitter card tag',
      passed: false,
      points: 0,
      maxPoints: 5,
      tip: 'Add <meta name="twitter:card" content="summary_large_image">.',
      category: AI_CATEGORY,
    };
    try {
      if (/<meta[^>]*name=["']twitter:card["'][^>]*>/i.test(pageHtml)) {
        twitterCheck.passed = true;
        twitterCheck.points = 5;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(twitterCheck);

    const headingCheck: AuditCheck = {
      name: 'Heading structure',
      passed: false,
      points: 0,
      maxPoints: 10,
      tip: 'Use one clear <h1> and supporting <h2> headings for crawler comprehension.',
      category: AI_CATEGORY,
    };
    try {
      const hasH1 = /<h1\b[^>]*>/i.test(pageHtml);
      const hasH2 = /<h2\b[^>]*>/i.test(pageHtml);
      if (hasH1 && hasH2) {
        headingCheck.passed = true;
        headingCheck.points = 10;
      } else if (hasH1) {
        headingCheck.points = 5;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(headingCheck);

    const sitemapCheck: AuditCheck = {
      name: 'sitemap.xml',
      passed: false,
      points: 0,
      maxPoints: 10,
      tip: 'Publish /sitemap.xml so AI crawlers can discover key pages quickly.',
      category: AI_CATEGORY,
    };
    try {
      const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`, { signal: withTimeoutSignal(10_000) });
      if (sitemapRes.status === 200) {
        sitemapCheck.passed = true;
        sitemapCheck.points = 10;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(sitemapCheck);

    const canonicalCheck: AuditCheck = {
      name: 'Canonical link',
      passed: false,
      points: 0,
      maxPoints: 5,
      tip: 'Add <link rel="canonical" href="..."> to reduce URL ambiguity.',
      category: AI_CATEGORY,
    };
    try {
      if (/<link[^>]*rel=["']canonical["'][^>]*>/i.test(pageHtml)) {
        canonicalCheck.passed = true;
        canonicalCheck.points = 5;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(canonicalCheck);

    const schemaCheck: AuditCheck = {
      name: 'Schema.org entity',
      passed: false,
      points: 0,
      maxPoints: 10,
      tip: 'Include Person or Organization in JSON-LD @type to improve trust signals.',
      category: AI_CATEGORY,
    };
    try {
      const types = parseJsonLdTypes(pageHtml);
      const hasEntity = types.some((t) => t === 'Person' || t === 'Organization');
      if (hasEntity) {
        schemaCheck.passed = true;
        schemaCheck.points = 10;
      }
    } catch {
      // Keep default failed state.
    }
    checks.push(schemaCheck);

    checks.push(...buildAccessibilityChecks(pageHtml));
    checks.push(...buildSecurityChecks(headers));

    const score = scoreFromChecks(checks);
    const topFixes = checks
      .filter((check) => !check.passed && !check.info)
      .sort((a, b) => (b.maxPoints - b.points) - (a.maxPoints - a.points))
      .slice(0, 3)
      .map((check) => check.tip);

    const result: GeoAuditResult = {
      url: baseUrl,
      score,
      grade: gradeFromScore(score),
      checks,
      topFixes,
      installCommand: 'pnpm add @varshylinc/geo',
      platform: platformResult.platform,
      platformConfidence: platformResult.confidence,
      platformSignals: platformResult.signals,
      fixApproach: platformResult.fixApproach,
    };

    const previousScore = parseCompareQuery(req.query.compare);
    if (previousScore != null) {
      const comparison = buildAuditComparison(
        score,
        checks,
        previousScore,
        body.previousChecks,
      );
      if (comparison) result.comparison = comparison;
    }

    res.json(result);
  });

  return router;
}
