import type { FixFile, GeoAudit, SiteMetadata } from './types.js';
import { domainFromUrl } from './site-metadata.js';

const CALENDLY = 'https://calendly.com/vaakapila';

function projectedScore(audit: GeoAudit, files: FixFile[]): number {
  const recovered = files.reduce((sum, f) => sum + f.pointsRecovered, 0);
  return Math.min(100, audit.score + recovered);
}

function platformInstructions(platform: string, filenames: string[]): string {
  const has = (name: string) => filenames.includes(name);
  const lines: string[] = [];

  const headFiles = filenames.filter((f) => f.startsWith('head-'));
  const rootFiles = filenames.filter(
    (f) => f === 'llms.txt' || f === 'sitemap.xml' || f === 'robots-additions.txt',
  );

  switch (platform) {
    case 'wordpress':
      if (headFiles.length) {
        lines.push(
          '**WordPress (head snippets):** Paste files from `head-*.html` into Appearance → Theme File Editor → header.php before `</head>`, or use a header/footer scripts plugin.',
        );
      }
      if (has('llms.txt')) {
        lines.push(
          '**llms.txt:** Upload to your site root via FTP/SFTP or a file manager plugin (same folder as wp-config.php / public_html).',
        );
      }
      if (has('sitemap.xml')) {
        lines.push(
          '**sitemap.xml:** Upload to site root. Submit the URL in Google Search Console if you use it.',
        );
      }
      if (has('robots-additions.txt')) {
        lines.push(
          '**robots-additions.txt:** Merge these lines into your existing `/robots.txt` — do not replace the whole file.',
        );
      }
      if (has('heading-guidance.md')) {
        lines.push(
          '**heading-guidance.md:** Update page copy in the WordPress editor following the guidance.',
        );
      }
      break;
    case 'shopify':
      if (headFiles.length) {
        lines.push(
          '**Shopify:** Online Store → Themes → Edit code → `theme.liquid` → paste `head-*.html` snippets before `</head>`.',
        );
      }
      for (const f of rootFiles) {
        lines.push(`**${f}:** Upload via Shopify Files or your hosting/CDN root as applicable.`);
      }
      break;
    case 'squarespace':
    case 'wix':
      if (headFiles.length) {
        lines.push(
          `**${platform}:** Settings → Custom Code / Code Injection → Header — paste each \`head-*.html\` snippet.`,
        );
      }
      for (const f of rootFiles) {
        lines.push(`**${f}:** Upload to your site root per ${platform} file hosting options.`);
      }
      break;
    default:
      if (headFiles.length) {
        lines.push(
          '**Static / custom site:** Paste each `head-*.html` snippet before `</head>` on your layout or index template.',
        );
      }
      for (const f of rootFiles) {
        lines.push(`**${f}:** Place in your website root directory (public_html or equivalent).`);
      }
      if (has('heading-guidance.md')) {
        lines.push('**heading-guidance.md:** Apply manually in your HTML page content.');
      }
  }

  return lines.length ? lines.join('\n') : 'Follow your platform docs to deploy the included files.';
}

export function buildReadme(
  audit: GeoAudit,
  meta: SiteMetadata,
  files: FixFile[],
): string {
  const domain = domainFromUrl(meta.url);
  const projected = projectedScore(audit, files);
  const fixCount = files.length;

  const table = files
    .map(
      (f) =>
        `| ${f.filename} | ${f.check} | +${f.pointsRecovered} pts |`,
    )
    .join('\n');

  return `# Soren Fixes It — Repair Package for ${domain}

**Score:** ${audit.score} → projected **${projected}** (${fixCount} fix${fixCount === 1 ? '' : 'es'})

## Files in this package

| File | Fixes | Points |
|------|-------|--------|
${table}

## Install instructions (${audit.platform})

${platformInstructions(audit.platform, files.map((f) => f.filename))}

## Verify

Re-run the free scan at [soren.varshyl.com](https://soren.varshyl.com) to confirm your new score.

## Need help applying everything?

- **AI Package — $1.99:** Paste \`PROMPT.txt\` into ChatGPT or Claude for step-by-step guidance.
- **Do it for me — $9.00:** Book a guided fix session → ${CALENDLY}
`;
}
