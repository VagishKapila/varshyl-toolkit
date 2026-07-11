import type { FixFile, SiteMetadata } from '../types.js';
import { CHECK_POINTS } from '../types.js';
import { cleanDisplayName, domainFromUrl, inferJsonLdType, resolveSiteDisplayName } from '../site-metadata.js';

type TemplateFn = (meta: SiteMetadata) => FixFile | null;

function pointsFor(check: string): number {
  return CHECK_POINTS[check] ?? 0;
}

export const llmsTxtTemplate: TemplateFn = (meta) => {
  const lines: string[] = [];
  const displayName = resolveSiteDisplayName(meta);
  lines.push(`# ${displayName}`);
  lines.push(`# ${meta.url}`);
  lines.push('');
  if (meta.description) {
    lines.push('## What this site offers');
    lines.push(meta.description);
    lines.push('');
  }
  if (meta.keywords?.length) {
    lines.push('## Topics and services');
    for (const kw of meta.keywords) lines.push(`- ${kw}`);
    lines.push('');
  }
  lines.push('## Key facts');
  lines.push(`URL: ${meta.url}`);
  const orgLabel = cleanOrgLabel(meta);
  if (orgLabel) lines.push(`Organization: ${orgLabel}`);
  return {
    filename: 'llms.txt',
    content: `${lines.join('\n').trim()}\n`,
    check: 'llms.txt',
    pointsRecovered: pointsFor('llms.txt'),
  };
};

export const robotsAdditionsTemplate: TemplateFn = () => ({
  filename: 'robots-additions.txt',
  content: `# Add these lines to your existing robots.txt
# Do not replace your whole robots.txt — append or merge these rules.

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /
`,
  check: 'robots.txt AI crawlers',
  pointsRecovered: pointsFor('robots.txt AI crawlers'),
});

export const headJsonLdTemplate: TemplateFn = (meta) => {
  const type = inferJsonLdType(meta);
  const displayName = resolveSiteDisplayName(meta);
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    url: meta.url,
  };
  if (displayName) payload.name = displayName;
  if (meta.description) payload.description = meta.description;

  return {
    filename: 'head-jsonld.html',
    content: `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>\n`,
    check: 'JSON-LD script',
    pointsRecovered: pointsFor('JSON-LD script'),
  };
};

export const headOgTemplate: TemplateFn = (meta) => {
  const lines: string[] = [];
  const title = meta.ogTitle || meta.title;
  const description = meta.ogDescription || meta.description;
  const image = meta.ogImage;
  const ogUrl = meta.ogUrl || meta.url;
  if (title) lines.push(`<meta property="og:title" content="${escapeAttr(title)}">`);
  if (description) {
    lines.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
  }
  if (image) lines.push(`<meta property="og:image" content="${escapeAttr(image)}">`);
  lines.push(`<meta property="og:url" content="${escapeAttr(ogUrl)}">`);
  lines.push('<meta property="og:type" content="website">');
  if (!lines.length) return null;
  return {
    filename: 'head-og.html',
    content: `${lines.join('\n')}\n`,
    check: 'Open Graph tags',
    pointsRecovered: pointsFor('Open Graph tags'),
  };
};

export const headTwitterTemplate: TemplateFn = (meta) => {
  const lines: string[] = [];
  const card = meta.twitterCard || 'summary_large_image';
  lines.push(`<meta name="twitter:card" content="${escapeAttr(card)}">`);
  const title = meta.twitterTitle || meta.ogTitle || meta.title;
  const description = meta.twitterDescription || meta.ogDescription || meta.description;
  const image = meta.twitterImage || meta.ogImage;
  if (title) lines.push(`<meta name="twitter:title" content="${escapeAttr(title)}">`);
  if (description) {
    lines.push(`<meta name="twitter:description" content="${escapeAttr(description)}">`);
  }
  if (image) lines.push(`<meta name="twitter:image" content="${escapeAttr(image)}">`);
  return {
    filename: 'head-twitter.html',
    content: `${lines.join('\n')}\n`,
    check: 'Twitter card tag',
    pointsRecovered: pointsFor('Twitter card tag'),
  };
};

export const headingGuidanceTemplate: TemplateFn = (meta) => {
  const issues: string[] = [];
  if (!meta.hasH1) issues.push('- No `<h1>` heading was detected on the homepage.');
  else if ((meta.h1Count ?? 0) > 1) {
    issues.push(`- Multiple \`<h1>\` headings detected (${meta.h1Count}). Use one primary H1.`);
  }
  if (!meta.hasH2) {
    issues.push('- No supporting `<h2>` headings were detected for section structure.');
  }

  const content = `# Heading structure guidance for ${domainFromUrl(meta.url)}

## What Soren detected
${issues.length ? issues.join('\n') : '- Headings need clearer hierarchy for AI crawlers.'}

## How to fix (manual content work)
1. Choose one page title that matches your primary offer and place it in a single \`<h1>\`.
2. Break major sections into descriptive \`<h2>\` headings (services, about, contact, pricing).
3. Avoid skipping levels (do not jump from H1 to H4).
4. Keep headings human-readable — they should summarize the section in plain language.

## Example structure
\`\`\`html
<h1>${meta.title ?? 'Your primary page topic'}</h1>
<h2>What we offer</h2>
<h2>Who we help</h2>
<h2>Contact</h2>
\`\`\`

This file is guidance only. Soren cannot auto-write your page copy.
`;
  return {
    filename: 'heading-guidance.md',
    content,
    check: 'Heading structure',
    pointsRecovered: pointsFor('Heading structure'),
  };
};

export const sitemapTemplate: TemplateFn = (meta) => {
  const today = new Date().toISOString().slice(0, 10);
  const loc = meta.canonicalUrl || meta.url;
  return {
    filename: 'sitemap.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
    check: 'sitemap.xml',
    pointsRecovered: pointsFor('sitemap.xml'),
  };
};

export const headCanonicalTemplate: TemplateFn = (meta) => ({
  filename: 'head-canonical.html',
  content: `<link rel="canonical" href="${escapeAttr(meta.canonicalUrl || meta.url)}">\n`,
  check: 'Canonical link',
  pointsRecovered: pointsFor('Canonical link'),
});

export const headSchemaTemplate: TemplateFn = (meta) => {
  const type = meta.orgName
    ? (meta.hasAddress ? 'LocalBusiness' : 'Organization')
    : 'Organization';
  const displayName = resolveSiteDisplayName(meta);
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    url: meta.url,
  };
  if (displayName) payload.name = displayName;

  return {
    filename: 'head-schema.html',
    content: `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>\n`,
    check: 'Schema.org entity',
    pointsRecovered: pointsFor('Schema.org entity'),
  };
};

export const CHECK_TEMPLATES: Record<string, TemplateFn> = {
  'llms.txt': llmsTxtTemplate,
  'robots.txt AI crawlers': robotsAdditionsTemplate,
  'JSON-LD script': headJsonLdTemplate,
  'Open Graph tags': headOgTemplate,
  'Twitter card tag': headTwitterTemplate,
  'Heading structure': headingGuidanceTemplate,
  'sitemap.xml': sitemapTemplate,
  'Canonical link': headCanonicalTemplate,
  'Schema.org entity': headSchemaTemplate,
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function cleanOrgLabel(meta: SiteMetadata): string | undefined {
  const domain = domainFromUrl(meta.url);
  const raw = meta.orgName || meta.title;
  if (!raw) return undefined;
  return cleanDisplayName(raw, { ogSiteName: meta.ogSiteName, domain });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
