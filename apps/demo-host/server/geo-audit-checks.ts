export const AI_CATEGORY = 'AI discoverability';
export const ADA_CATEGORY = 'Accessibility basics';
export const SECURITY_CATEGORY = 'Security hardening';

export const SCORABLE_MAX_POINTS = 140;

export interface AuditCheckResult {
  name: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  tip: string;
  category: string;
  info?: boolean;
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

function parseTagAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
  for (const match of tag.matchAll(attrRegex)) {
    const key = (match[1] ?? '').toLowerCase();
    if (!key || key === 'img' || key === 'input' || key === 'select' || key === 'textarea') {
      continue;
    }
    attrs[key] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

export function checkAltText(html: string): Pick<AuditCheckResult, 'passed' | 'points'> {
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  if (imgTags.length === 0) return { passed: true, points: 5 };
  const missing = imgTags.filter((tag) => !/\balt\s*=/i.test(tag)).length;
  if (missing === 0) return { passed: true, points: 5 };
  const withAlt = imgTags.length - missing;
  const points = Math.round((withAlt / imgTags.length) * 5);
  return { passed: false, points };
}

export function checkHeadingHierarchy(html: string): Pick<AuditCheckResult, 'passed' | 'points'> {
  const headingRegex = /<h([1-6])\b[^>]*>/gi;
  const levels: number[] = [];
  for (const match of html.matchAll(headingRegex)) {
    const level = Number(match[1]);
    if (level >= 1 && level <= 6) levels.push(level);
  }
  if (levels.length === 0) return { passed: false, points: 0 };

  const h1Count = levels.filter((l) => l === 1).length;
  let hasSkip = false;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      hasSkip = true;
      break;
    }
  }

  if (h1Count === 1 && !hasSkip) return { passed: true, points: 5 };
  if (h1Count === 1) return { passed: false, points: 2 };
  return { passed: false, points: 0 };
}

function isHiddenInput(tag: string): boolean {
  const attrs = parseTagAttrs(tag);
  const type = (attrs.type ?? '').toLowerCase();
  return type === 'hidden' || /\bhidden\b/i.test(tag);
}

function inputHasLabel(html: string, tag: string, index: number): boolean {
  const attrs = parseTagAttrs(tag);
  const id = attrs.id?.trim();
  if (id) {
    const labelFor = new RegExp(
      `<label\\b[^>]*\\bfor\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
      'i',
    );
    if (labelFor.test(html)) return true;
  }

  const before = html.slice(0, index);
  const openLabels = (before.match(/<label\b[^>]*>/gi) ?? []).length;
  const closeLabels = (before.match(/<\/label>/gi) ?? []).length;
  return openLabels > closeLabels;
}

export function checkFormLabels(html: string): Pick<AuditCheckResult, 'passed' | 'points'> {
  const fieldRegex = /<(input|select|textarea)\b[^>]*>/gi;
  const fields: { tag: string; index: number }[] = [];
  for (const match of html.matchAll(fieldRegex)) {
    const tag = match[0] ?? '';
    const index = match.index ?? 0;
    if (match[1]?.toLowerCase() === 'input' && isHiddenInput(tag)) continue;
    fields.push({ tag, index });
  }

  if (fields.length === 0) return { passed: true, points: 5 };

  const unlabeled = fields.filter((f) => !inputHasLabel(html, f.tag, f.index)).length;
  if (unlabeled === 0) return { passed: true, points: 5 };
  return { passed: false, points: 0 };
}

export function checkLandmarks(html: string): Pick<AuditCheckResult, 'passed' | 'points'> {
  const hasMain = /<main\b/i.test(html);
  const hasNav = /<nav\b/i.test(html);
  const hasHeader = /<header\b/i.test(html);
  const present = [hasMain, hasNav, hasHeader].filter(Boolean).length;
  const points = present + (present === 3 ? 2 : 0);
  return { passed: present === 3, points: Math.min(5, points) };
}

export function checkLangAttribute(html: string): Pick<AuditCheckResult, 'passed' | 'points'> {
  const match = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<html\b[^>]*>/i);
  if (!match) return { passed: false, points: 0 };
  const langMatch = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["'][^>]*>/i);
  const lang = langMatch?.[1]?.trim();
  if (lang) return { passed: true, points: 5 };
  return { passed: false, points: 0 };
}

export function checkStrictTransportSecurity(
  headers: Record<string, string>,
): Pick<AuditCheckResult, 'passed' | 'points'> {
  const value = getHeader(headers, 'strict-transport-security');
  if (!value) return { passed: false, points: 0 };
  const maxAgeMatch = value.match(/max-age\s*=\s*(\d+)/i);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
  if (maxAge >= 31536000) return { passed: true, points: 5 };
  return { passed: false, points: 2 };
}

export function checkXContentTypeOptions(
  headers: Record<string, string>,
): Pick<AuditCheckResult, 'passed' | 'points'> {
  const value = getHeader(headers, 'x-content-type-options');
  if (value?.toLowerCase() === 'nosniff') return { passed: true, points: 3 };
  return { passed: false, points: 0 };
}

export function checkXFrameOptions(
  headers: Record<string, string>,
): Pick<AuditCheckResult, 'passed' | 'points'> {
  const xfo = getHeader(headers, 'x-frame-options');
  if (xfo) {
    const normalized = xfo.toUpperCase();
    if (normalized === 'DENY' || normalized === 'SAMEORIGIN') {
      return { passed: true, points: 3 };
    }
  }
  const csp = getHeader(headers, 'content-security-policy')
    ?? getHeader(headers, 'content-security-policy-report-only');
  if (csp && /frame-ancestors/i.test(csp)) return { passed: true, points: 3 };
  return { passed: false, points: 0 };
}

export function checkContentSecurityPolicy(
  headers: Record<string, string>,
): Pick<AuditCheckResult, 'passed' | 'points'> {
  const csp = getHeader(headers, 'content-security-policy')
    ?? getHeader(headers, 'content-security-policy-report-only');
  if (csp?.trim()) return { passed: true, points: 4 };
  return { passed: false, points: 0 };
}

export function buildAccessibilityChecks(html: string): AuditCheckResult[] {
  const alt = checkAltText(html);
  const hierarchy = checkHeadingHierarchy(html);
  const labels = checkFormLabels(html);
  const landmarks = checkLandmarks(html);
  const lang = checkLangAttribute(html);

  return [
    {
      name: 'Alt text',
      ...alt,
      maxPoints: 5,
      tip: 'Add descriptive alt text to all images.',
      category: ADA_CATEGORY,
    },
    {
      name: 'Heading hierarchy',
      ...hierarchy,
      maxPoints: 5,
      tip: 'Use one <h1> and sequential <h2>–<h6> without skipping levels.',
      category: ADA_CATEGORY,
    },
    {
      name: 'Form labels',
      ...labels,
      maxPoints: 5,
      tip: 'Add a <label> for every form input.',
      category: ADA_CATEGORY,
    },
    {
      name: 'Landmarks',
      ...landmarks,
      maxPoints: 5,
      tip: 'Use semantic HTML landmarks: <main>, <nav>, <header>.',
      category: ADA_CATEGORY,
    },
    {
      name: 'Lang attribute',
      ...lang,
      maxPoints: 5,
      tip: 'Add lang="en" (or appropriate) to your <html> tag.',
      category: ADA_CATEGORY,
    },
    {
      name: 'Color contrast',
      passed: true,
      points: 0,
      maxPoints: 0,
      tip: 'Use a contrast checker to verify 4.5:1 ratio for text.',
      category: ADA_CATEGORY,
      info: true,
    },
  ];
}

export function buildSecurityChecks(headers: Record<string, string>): AuditCheckResult[] {
  const hsts = checkStrictTransportSecurity(headers);
  const xcto = checkXContentTypeOptions(headers);
  const xfo = checkXFrameOptions(headers);
  const csp = checkContentSecurityPolicy(headers);

  return [
    {
      name: 'Strict-Transport-Security',
      ...hsts,
      maxPoints: 5,
      tip: 'Add HSTS header to enforce HTTPS.',
      category: SECURITY_CATEGORY,
    },
    {
      name: 'X-Content-Type-Options',
      ...xcto,
      maxPoints: 3,
      tip: 'Add X-Content-Type-Options: nosniff.',
      category: SECURITY_CATEGORY,
    },
    {
      name: 'X-Frame-Options',
      ...xfo,
      maxPoints: 3,
      tip: 'Add X-Frame-Options to prevent clickjacking.',
      category: SECURITY_CATEGORY,
    },
    {
      name: 'Content-Security-Policy',
      ...csp,
      maxPoints: 4,
      tip: 'Add a Content-Security-Policy header.',
      category: SECURITY_CATEGORY,
    },
  ];
}

export function scoreFromChecks(checks: AuditCheckResult[]): number {
  const earned = checks.reduce((sum, c) => sum + c.points, 0);
  const pct = Math.round((earned / SCORABLE_MAX_POINTS) * 100);
  return Math.max(0, Math.min(100, pct));
}
