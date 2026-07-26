import { expect, test } from 'vitest';
import { generateFixPackage } from '../fix-generator/generate-fix-package.js';
import type { GeoAudit, SiteMetadata } from '../fix-generator/types.js';
import { buildZipBuffer } from '../fix-generator/package-zip.js';
import { buildReadme } from '../fix-generator/readme-template.js';
import { scannerUrl } from '../fix-generator/scanner-url.js';
import { buildAuditFromScan } from '../fix-router.js';

const espnMeta: SiteMetadata = {
  url: 'https://www.espn.com',
  platform: 'static-html',
  title: 'ESPN - Serving Sports Fans. Anytime. Anywhere.',
  description: 'Visit ESPN for live scores, highlights and news.',
  ogImage: 'https://www.espn.com/og-image.jpg',
  orgName: 'ESPN',
  hasH1: false,
  hasH2: true,
  h1Count: 0,
  keywords: ['Sports', 'Scores', 'News'],
};

function auditWithFailing(names: string[]): GeoAudit {
  return {
    url: 'https://www.espn.com',
    score: 55,
    platform: 'static-html',
    checks: [
      {
        name: 'llms.txt',
        passed: !names.includes('llms.txt'),
        points: names.includes('llms.txt') ? 0 : 20,
        maxPoints: 20,
        tip: 'Publish llms.txt',
      },
      {
        name: 'robots.txt AI crawlers',
        passed: !names.includes('robots.txt AI crawlers'),
        points: names.includes('robots.txt AI crawlers') ? 0 : 15,
        maxPoints: 15,
        tip: 'Allow AI crawlers',
      },
      {
        name: 'Heading structure',
        passed: !names.includes('Heading structure'),
        points: names.includes('Heading structure') ? 0 : 10,
        maxPoints: 10,
        tip: 'Fix headings',
      },
      {
        name: 'sitemap.xml',
        passed: !names.includes('sitemap.xml'),
        points: names.includes('sitemap.xml') ? 0 : 10,
        maxPoints: 10,
        tip: 'Add sitemap',
      },
      {
        name: 'Open Graph tags',
        passed: true,
        points: 10,
        maxPoints: 10,
        tip: '',
      },
    ],
  };
}

test('only generates files for failing checks', () => {
  const result = generateFixPackage({
    audit: auditWithFailing(['llms.txt', 'robots.txt AI crawlers', 'Heading structure']),
    siteMetadata: espnMeta,
  });
  const names = result.files.map((f) => f.filename);
  expect(names).toContain('llms.txt');
  expect(names).toContain('robots-additions.txt');
  expect(names).toContain('heading-guidance.md');
  expect(names).not.toContain('head-og.html');
  expect(names).not.toContain('sitemap.xml');
});

test('llms.txt uses cleaned site name not bare domain', () => {
  const result = generateFixPackage({
    audit: auditWithFailing(['llms.txt']),
    siteMetadata: espnMeta,
  });
  const llms = result.files.find((f) => f.filename === 'llms.txt');
  expect(llms?.content).toMatch(/^# ESPN/m);
  expect(llms?.content).not.toMatch(/^# espn\.com/m);
});

test('robots-additions is additions only', () => {
  const result = generateFixPackage({
    audit: auditWithFailing(['robots.txt AI crawlers']),
    siteMetadata: espnMeta,
  });
  const robots = result.files.find((f) => f.filename === 'robots-additions.txt');
  expect(robots?.content).toContain('Add these lines to your existing robots.txt');
  expect(robots?.content).not.toContain('Disallow: /');
});

test('sitemap uses real URL and today date', () => {
  const meta: SiteMetadata = {
    url: 'https://varshyl.com',
    platform: 'static-html',
    canonicalUrl: 'https://varshyl.com',
  };
  const result = generateFixPackage({
    audit: auditWithFailing(['sitemap.xml']),
    siteMetadata: meta,
  });
  const sitemap = result.files.find((f) => f.filename === 'sitemap.xml');
  expect(sitemap?.content).toContain('<loc>https://varshyl.com</loc>');
  expect(sitemap?.content).toContain(new Date().toISOString().slice(0, 10));
});

test('JSON-LD never uses SoftwareApplication price 0', () => {
  const result = generateFixPackage({
    audit: {
      url: 'https://example.com',
      score: 85,
      platform: 'static-html',
      checks: [
        {
          name: 'JSON-LD script',
          passed: false,
          points: 0,
          maxPoints: 15,
          tip: 'Add JSON-LD',
        },
      ],
    },
    siteMetadata: {
      url: 'https://example.com',
      platform: 'static-html',
      title: 'Example Co',
      orgName: 'Example Organization',
    },
  });
  const jsonld = result.files.find((f) => f.filename === 'head-jsonld.html');
  expect(jsonld?.content).not.toContain('SoftwareApplication');
  expect(jsonld?.content).not.toContain('"price": "0"');
  expect(jsonld?.content).toContain('Organization');
});

test('readme mentions only included fixes', () => {
  const files = generateFixPackage({
    audit: auditWithFailing(['sitemap.xml']),
    siteMetadata: {
      url: 'https://varshyl.com',
      platform: 'static-html',
    },
  }).files;
  const readme = buildReadme(
    auditWithFailing(['sitemap.xml']),
    { url: 'https://varshyl.com', platform: 'static-html' },
    files,
  );
  expect(readme).toContain('sitemap.xml');
  expect(readme).not.toContain('llms.txt');
  expect(readme).toContain('$1.99');
  expect(readme).toContain('$9.00');
});

test('prompt includes failing checks and embedded file contents', () => {
  const generated = generateFixPackage({
    audit: auditWithFailing(['llms.txt']),
    siteMetadata: espnMeta,
  });
  expect(generated.prompt).toContain('llms.txt');
  expect(generated.prompt).toMatch(/# ESPN/);
  expect(generated.prompt).toContain('How is your website hosted?');
  expect(generated.prompt).not.toContain('Open Graph');
});

test('zip contains readme and fix files', async () => {
  const generated = generateFixPackage({
    audit: auditWithFailing(['sitemap.xml']),
    siteMetadata: { url: 'https://varshyl.com', platform: 'static-html' },
  });
  const zip = await buildZipBuffer([
    { filename: 'README.md', content: generated.readme },
    ...generated.files.map((f) => ({ filename: f.filename, content: f.content })),
  ]);
  expect(zip.byteLength).toBeGreaterThan(100);
});

test('schema and llms prefer og:site_name and strip title suffixes', () => {
  const nbaMeta: SiteMetadata = {
    url: 'https://www.nba.com',
    platform: 'static-html',
    title: 'The official site of the NBA... | NBA.com',
    orgName: 'The official site of the NBA... | NBA.com',
    ogSiteName: 'NBA.com',
  };
  const audit: GeoAudit = {
    url: 'https://www.nba.com',
    score: 40,
    platform: 'static-html',
    checks: [
      {
        name: 'llms.txt',
        passed: false,
        points: 0,
        maxPoints: 20,
        tip: 'Add llms.txt',
      },
      {
        name: 'Schema.org entity',
        passed: false,
        points: 0,
        maxPoints: 10,
        tip: 'Add schema',
      },
      {
        name: 'JSON-LD script',
        passed: false,
        points: 0,
        maxPoints: 15,
        tip: 'Add JSON-LD',
      },
    ],
  };
  const result = generateFixPackage({ audit, siteMetadata: nbaMeta });
  const llms = result.files.find((f) => f.filename === 'llms.txt');
  const jsonld = result.files.find((f) => f.filename === 'head-jsonld.html');

  expect(llms?.content).toMatch(/^# NBA\.com/m);
  expect(llms?.content).not.toContain('The official site of the NBA');
  expect(jsonld?.content).toContain('"name": "NBA.com"');
  expect(jsonld?.content).toContain('"@graph"');
  expect(result.files.filter((f) => f.filename === 'head-jsonld.html')).toHaveLength(1);
});

test('title suffix cleanup without og:site_name uses trailing brand segment', () => {
  const meta: SiteMetadata = {
    url: 'https://www.nba.com',
    platform: 'static-html',
    title: 'The official site of the NBA... | NBA.com',
    orgName: 'The official site of the NBA... | NBA.com',
  };
  const result = generateFixPackage({
    audit: {
      url: meta.url,
      score: 40,
      platform: 'static-html',
      checks: [
        {
          name: 'Schema.org entity',
          passed: false,
          points: 0,
          maxPoints: 10,
          tip: 'Add schema',
        },
      ],
    },
    siteMetadata: meta,
  });
  const jsonld = result.files.find((f) => f.filename === 'head-jsonld.html');
  expect(jsonld?.content).toContain('"name": "NBA.com"');
});

test('ADA and security failing checks include guidance and disclaimers', () => {
  const audit: GeoAudit = {
    url: 'https://example.com',
    score: 50,
    platform: 'static-html',
    checks: [
      {
        name: 'Alt text',
        passed: false,
        points: 0,
        maxPoints: 5,
        tip: 'Add descriptive alt text to all images.',
        category: 'Accessibility basics',
      },
      {
        name: 'Strict-Transport-Security',
        passed: false,
        points: 0,
        maxPoints: 5,
        tip: 'Add HSTS header to enforce HTTPS.',
        category: 'Security hardening',
      },
      {
        name: 'X-Frame-Options',
        passed: false,
        points: 0,
        maxPoints: 3,
        tip: 'Add X-Frame-Options to prevent clickjacking.',
        category: 'Security hardening',
      },
    ],
  };
  const result = generateFixPackage({
    audit,
    siteMetadata: { url: 'https://example.com', platform: 'static-html' },
  });
  const names = result.files.map((f) => f.filename);
  expect(names).toContain('alt-text-guidance.md');
  expect(names).toContain('security-headers-guidance.md');
  expect(names.filter((n) => n === 'security-headers-guidance.md')).toHaveLength(1);
  expect(result.readme).toContain('NOT LEGAL ADVICE');
  expect(result.prompt).toContain('not a full legal compliance audit');
});

test('disclaimer appears when audit checks omit category (fix API path)', () => {
  const audit: GeoAudit = {
    url: 'https://example.com',
    score: 50,
    platform: 'static-html',
    checks: [
      {
        name: 'Alt text',
        passed: false,
        points: 0,
        maxPoints: 5,
        tip: 'Add descriptive alt text to all images.',
      },
      {
        name: 'Strict-Transport-Security',
        passed: false,
        points: 0,
        maxPoints: 5,
        tip: 'Add HSTS header to enforce HTTPS.',
      },
    ],
  };
  const result = generateFixPackage({
    audit,
    siteMetadata: { url: 'https://example.com', platform: 'static-html' },
  });
  expect(result.readme).toContain('IMPORTANT NOTICE — NOT LEGAL ADVICE');
  expect(result.readme).toContain('### Accessibility basics');
  expect(result.readme).toContain('### Security hardening');
  expect(result.prompt).toContain('not a full legal compliance audit');
  expect(result.prompt).toContain('Shall I proceed with the technical improvements?');
});

test('assembled prompt file sections are complete, fenced, and not truncated', () => {
  const result = generateFixPackage({
    audit: {
      url: 'https://varshylai.com',
      score: 56,
      platform: 'static-html',
      checks: [
        {
          name: 'JSON-LD script',
          passed: false,
          points: 0,
          maxPoints: 15,
          tip: 'Add JSON-LD',
        },
        {
          name: 'Form labels',
          passed: false,
          points: 0,
          maxPoints: 5,
          tip: 'Add labels',
          category: 'Accessibility basics',
        },
        {
          name: 'Landmarks',
          passed: false,
          points: 0,
          maxPoints: 5,
          tip: 'Add landmarks',
          category: 'Accessibility basics',
        },
      ],
    },
    siteMetadata: {
      url: 'https://varshylai.com',
      platform: 'static-html',
      title: 'AI Discoverability Toolkit — Make Your Website Understandable by AI',
      description:
        'Scan what AI understands about your website and improve discoverability.',
    },
  });

  const prompt = result.prompt;
  for (const file of result.files) {
    const sectionHeader = `### ${file.filename} (fixes:`;
    const start = prompt.indexOf(sectionHeader);
    expect(start).toBeGreaterThanOrEqual(0);
    const nextHeading = prompt.indexOf('\n### ', start + sectionHeader.length);
    const workflowStart = prompt.indexOf('\nWORKFLOW RULES:', start + sectionHeader.length);
    const endCandidates = [nextHeading, workflowStart].filter((i) => i >= 0);
    const sectionEnd = endCandidates.length ? Math.min(...endCandidates) : prompt.length;
    const section = prompt.slice(start, sectionEnd);

    const openFenceMatch = section.match(/\n(`{3,})\n/);
    expect(openFenceMatch).toBeTruthy();
    const fence = openFenceMatch?.[1] ?? '```';
    const contentStart = section.indexOf(`${fence}\n`) + fence.length + 1;
    const contentEnd = section.indexOf(`\n${fence}`, contentStart);
    expect(contentEnd).toBeGreaterThan(contentStart);
    const body = section.slice(contentStart, contentEnd).trim();
    expect(body.length).toBeGreaterThan(0);
  }

  const fenceLine = /^(`{3,})$/;
  let openFence: string | null = null;
  for (const line of prompt.split('\n')) {
    const match = line.match(fenceLine);
    if (!match) continue;
    const fence = match[1];
    if (openFence === null) {
      openFence = fence;
      continue;
    }
    if (fence === openFence) {
      openFence = null;
    }
  }
  expect(openFence).toBeNull();

  const expectedEnding =
    `When all files are applied, congratulate me and remind me to rescan at ${scannerUrl()}.`;
  expect(prompt.trimEnd().endsWith(expectedEnding)).toBe(true);
});

test('varshylai json-ld uses Varshyl Inc as organization name', () => {
  const result = generateFixPackage({
    audit: {
      url: 'https://varshylai.com',
      score: 56,
      platform: 'static-html',
      checks: [
        {
          name: 'JSON-LD script',
          passed: false,
          points: 0,
          maxPoints: 15,
          tip: 'Add JSON-LD',
        },
      ],
    },
    siteMetadata: {
      url: 'https://varshylai.com',
      platform: 'static-html',
      title: 'Make Your Website Understandable by AI',
      description: 'AI discoverability scanner',
    },
  });

  const jsonld = result.files.find((f) => f.filename === 'head-jsonld.html');
  expect(jsonld?.content).toContain('"name": "Make Your Website Understandable by AI"');
  expect(jsonld?.content).toContain('"name": "Varshyl Inc."');
});

test('open graph snippet always includes og:image with replace instruction', () => {
  const result = generateFixPackage({
    audit: {
      url: 'https://example.com',
      score: 70,
      platform: 'static-html',
      checks: [
        {
          name: 'Open Graph tags',
          passed: false,
          points: 0,
          maxPoints: 10,
          tip: 'Include og:title, og:description, og:image, and og:url meta tags.',
        },
      ],
    },
    siteMetadata: {
      url: 'https://example.com',
      platform: 'static-html',
      title: 'Example',
      description: 'Example description',
    },
  });
  const og = result.files.find((f) => f.filename === 'head-og.html');
  expect(og?.content).toContain('Replace og:image with a real 1200x630 public image URL');
  expect(og?.content).toContain('property="og:image"');
});

test('prompt current score matches scan response score', () => {
  const audit = buildAuditFromScan(
    'https://varshylai.com',
    'static-html',
    [{ name: 'robots.txt AI crawlers', tip: 'Allow AI bots.' }],
    {
      score: 56,
      checks: [
        {
          name: 'robots.txt AI crawlers',
          points: 7,
          maxPoints: 15,
          tip: 'Allow GPTBot, ClaudeBot, PerplexityBot, and anthropic-ai in robots.txt.',
          category: 'AI discoverability',
        },
      ],
    },
  );

  const generated = generateFixPackage({
    audit,
    siteMetadata: {
      url: 'https://varshylai.com',
      platform: 'static-html',
      title: 'AI Discoverability Toolkit — Make Your Website Understandable by AI',
      description: 'Scan what AI understands about your website.',
    },
  });
  expect(generated.prompt).toContain('Current score: 56');
});
