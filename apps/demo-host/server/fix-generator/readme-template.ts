import type { FixFile, GeoAudit, SiteMetadata } from './types.js';
import { SCORABLE_MAX_POINTS } from './types.js';
import { domainFromUrl } from './site-metadata.js';
import {
  ADA_CATEGORY,
  categoryForCheckName,
  isAdaOrSecurityCategory,
  isAdaOrSecurityCheck,
  README_ADA_DISCLAIMER,
  SECURITY_CATEGORY,
} from './compliance-disclaimers.js';

const CALENDLY = 'https://calendly.com/vaakapila';

function projectedScore(audit: GeoAudit, files: FixFile[]): number {
  const recovered = files.reduce((sum, f) => sum + f.pointsRecovered, 0);
  const recoveredPct = Math.round((recovered / SCORABLE_MAX_POINTS) * 100);
  return Math.min(100, audit.score + recoveredPct);
}

function categoryForCheck(audit: GeoAudit, checkName: string): string {
  return (
    audit.checks.find((c) => c.name === checkName)?.category
    ?? categoryForCheckName(checkName)
  );
}

function buildFileSections(audit: GeoAudit, files: FixFile[]): string {
  const groups = new Map<string, FixFile[]>();
  for (const file of files) {
    const category = categoryForCheck(audit, file.check);
    const list = groups.get(category) ?? [];
    list.push(file);
    groups.set(category, list);
  }

  const order = ['AI discoverability', ADA_CATEGORY, SECURITY_CATEGORY];
  const sections: string[] = [];
  let disclaimerShown = false;

  for (const category of order) {
    const group = groups.get(category);
    if (!group?.length) continue;

    if (isAdaOrSecurityCategory(category) && !disclaimerShown) {
      sections.push(README_ADA_DISCLAIMER);
      disclaimerShown = true;
    }

    sections.push(`### ${category}\n`);
    sections.push(
      group
        .map((f) => `- **${f.filename}** — fixes ${f.check} (+${f.pointsRecovered} pts)`)
        .join('\n'),
    );
  }

  for (const [category, group] of groups) {
    if (order.includes(category)) continue;
    sections.push(`### ${category}\n`);
    sections.push(
      group
        .map((f) => `- **${f.filename}** — fixes ${f.check} (+${f.pointsRecovered} pts)`)
        .join('\n'),
    );
  }

  return sections.join('\n\n');
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
      if (has('heading-hierarchy-guidance.md')) {
        lines.push(
          '**heading-hierarchy-guidance.md:** Fix heading levels in your page templates following the guidance.',
        );
      }
      if (has('alt-text-guidance.md') || has('form-labels-guidance.md') || has('landmarks-guidance.md')) {
        lines.push(
          '**Accessibility guidance files:** Apply manually in your theme templates or page editor.',
        );
      }
      if (has('lang-attribute.html')) {
        lines.push(
          '**lang-attribute.html:** Add the lang attribute to your root `<html>` tag.',
        );
      }
      if (has('security-headers-guidance.md')) {
        lines.push(
          '**security-headers-guidance.md:** Configure headers in your hosting panel or server config.',
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
      if (has('heading-hierarchy-guidance.md')) {
        lines.push('**heading-hierarchy-guidance.md:** Apply manually in your HTML page content.');
      }
      if (has('alt-text-guidance.md') || has('form-labels-guidance.md') || has('landmarks-guidance.md')) {
        lines.push('**Accessibility guidance files:** Apply manually in your HTML templates.');
      }
      if (has('lang-attribute.html')) {
        lines.push('**lang-attribute.html:** Add to your root `<html>` element.');
      }
      if (has('security-headers-guidance.md')) {
        lines.push('**security-headers-guidance.md:** Configure via your host, CDN, or server config.');
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

  const groupedFiles = buildFileSections(audit, files);
  const hasComplianceFixes = files.some((f) => isAdaOrSecurityCheck(f.check));

  return `# Soren Fixes It — Repair Package for ${domain}

**Score:** ${audit.score} → projected **${projected}** (${fixCount} fix${fixCount === 1 ? '' : 'es'})

## Files in this package

| File | Fixes | Points |
|------|-------|--------|
${table}

${hasComplianceFixes && !groupedFiles.includes('NOT LEGAL ADVICE') ? `${README_ADA_DISCLAIMER}\n\n` : ''}${groupedFiles}

## Install instructions (${audit.platform})

${platformInstructions(audit.platform, files.map((f) => f.filename))}

## Verify

Re-run the free scan at [soren.varshyl.com](https://soren.varshyl.com) to confirm your new score.

## Need help applying everything?

- **AI Package — $1.99:** Paste \`PROMPT.txt\` into ChatGPT or Claude for step-by-step guidance.
- **Do it for me — $9.00:** Book a guided fix session → ${CALENDLY}
`;
}
