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

export const altTextGuidanceTemplate: TemplateFn = (meta) => ({
  filename: 'alt-text-guidance.md',
  content: `# Alt text guidance for ${domainFromUrl(meta.url)}

## Why this matters
Screen readers and AI crawlers rely on \`alt\` text to understand images.
Every meaningful \`<img>\` should include a descriptive \`alt\` attribute.

## What to fix
1. Find images missing \`alt\` (especially logos, hero images, and product photos).
2. Add concise, descriptive alt text — not "image" or the filename.
3. Use \`alt=""\` only for purely decorative images.

## Examples
\`\`\`html
<img src="/logo.png" alt="${resolveSiteDisplayName(meta)} logo">
<img src="/hero.jpg" alt="Team collaborating in a bright office">
<img src="/divider.svg" alt="" role="presentation">
\`\`\`

This file is guidance only — update your HTML templates manually.
`,
  check: 'Alt text',
  pointsRecovered: pointsFor('Alt text'),
});

export const headingHierarchyGuidanceTemplate: TemplateFn = (meta) => ({
  filename: 'heading-hierarchy-guidance.md',
  content: `# Heading hierarchy guidance for ${domainFromUrl(meta.url)}

## What Soren checks
- Exactly one \`<h1>\` per page
- No skipped heading levels (e.g. \`<h1>\` followed by \`<h3>\` with no \`<h2>\`)

## How to fix
1. Keep one primary \`<h1>\` that describes the page topic.
2. Use \`<h2>\` for major sections, \`<h3>\` for subsections — never skip a level.
3. Do not use headings only for styling; use CSS for visual size.

## Example structure
\`\`\`html
<h1>${meta.title ?? 'Your primary page topic'}</h1>
<h2>Services</h2>
<h3>Consulting</h3>
<h2>Contact</h2>
\`\`\`

This file is guidance only. Soren cannot auto-write your page copy.
`,
  check: 'Heading hierarchy',
  pointsRecovered: pointsFor('Heading hierarchy'),
});

export const formLabelsGuidanceTemplate: TemplateFn = (meta) => ({
  filename: 'form-labels-guidance.md',
  content: `# Form label guidance for ${domainFromUrl(meta.url)}

## Why this matters
Every \`<input>\`, \`<select>\`, and \`<textarea>\` needs an associated \`<label>\`
so assistive technology can announce the field purpose.

## Association patterns
**Wrap the input inside the label:**
\`\`\`html
<label>
  Email
  <input type="email" name="email">
</label>
\`\`\`

**Or link with \`for\` + \`id\`:**
\`\`\`html
<label for="email">Email</label>
<input type="email" id="email" name="email">
\`\`\`

## Checklist
- [ ] Every visible field has a visible label
- [ ] \`for\` values match \`id\` values exactly
- [ ] Placeholder text is not used as a substitute for labels

This file is guidance only — update your forms manually.
`,
  check: 'Form labels',
  pointsRecovered: pointsFor('Form labels'),
});

export const landmarksGuidanceTemplate: TemplateFn = (meta) => ({
  filename: 'landmarks-guidance.md',
  content: `# Semantic landmarks guidance for ${domainFromUrl(meta.url)}

## Required landmarks
Soren looks for these HTML5 landmark elements:
- \`<header>\` — site or page header
- \`<nav>\` — primary navigation
- \`<main>\` — primary page content (one per page)

## Example layout
\`\`\`html
<body>
  <header>
    <nav aria-label="Primary">
      <a href="/">Home</a>
    </nav>
  </header>
  <main>
    <h1>${meta.title ?? 'Page title'}</h1>
    <!-- primary content -->
  </main>
  <footer>...</footer>
</body>
\`\`\`

Replace generic \`<div>\` wrappers with semantic elements where appropriate.
`,
  check: 'Landmarks',
  pointsRecovered: pointsFor('Landmarks'),
});

export const langAttributeTemplate: TemplateFn = () => ({
  filename: 'lang-attribute.html',
  content: '<html lang="en">\n',
  check: 'Lang attribute',
  pointsRecovered: pointsFor('Lang attribute'),
});

export const securityHeadersGuidance = (checkName: string): TemplateFn => (meta) => ({
  filename: 'security-headers-guidance.md',
  content: `# Security headers guidance for ${domainFromUrl(meta.url)}

## Headers Soren checks
| Header | Purpose |
|--------|---------|
| Strict-Transport-Security | Force HTTPS for returning visitors |
| X-Content-Type-Options: nosniff | Prevent MIME-type sniffing |
| X-Frame-Options / CSP frame-ancestors | Reduce clickjacking risk |
| Content-Security-Policy | Restrict script and resource sources |

## Apache (.htaccess)
\`\`\`apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Content-Security-Policy "default-src 'self'"
\`\`\`

## Nginx
\`\`\`nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Content-Security-Policy "default-src 'self'" always;
\`\`\`

## Cloudflare
Dashboard → SSL/TLS → enable HSTS. Use Transform Rules or Page Rules to add response headers.

## Vercel (vercel.json)
\`\`\`json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'" }
      ]
    }
  ]
}
\`\`\`

## Next.js (next.config.js)
\`\`\`js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "default-src 'self'" },
    ],
  }];
}
\`\`\`

Tune CSP for your real asset domains before deploying to production.
`,
  check: checkName,
  pointsRecovered: pointsFor(checkName),
});

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
  'Alt text': altTextGuidanceTemplate,
  'Heading hierarchy': headingHierarchyGuidanceTemplate,
  'Form labels': formLabelsGuidanceTemplate,
  'Landmarks': landmarksGuidanceTemplate,
  'Lang attribute': langAttributeTemplate,
  'Strict-Transport-Security': securityHeadersGuidance('Strict-Transport-Security'),
  'X-Content-Type-Options': securityHeadersGuidance('X-Content-Type-Options'),
  'X-Frame-Options': securityHeadersGuidance('X-Frame-Options'),
  'Content-Security-Policy': securityHeadersGuidance('Content-Security-Policy'),
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
