export const ADA_CATEGORY = 'Accessibility basics';
export const SECURITY_CATEGORY = 'Security hardening';
export const AI_CATEGORY = 'AI discoverability';

/** Maps every audit check name to its category (used when API omits category). */
export const CHECK_CATEGORIES: Record<string, string> = {
  'llms.txt': AI_CATEGORY,
  'robots.txt AI crawlers': AI_CATEGORY,
  'JSON-LD script': AI_CATEGORY,
  'Open Graph tags': AI_CATEGORY,
  'Twitter card tag': AI_CATEGORY,
  'Heading structure': AI_CATEGORY,
  'sitemap.xml': AI_CATEGORY,
  'Canonical link': AI_CATEGORY,
  'Schema.org entity': AI_CATEGORY,
  'Alt text': ADA_CATEGORY,
  'Heading hierarchy': ADA_CATEGORY,
  'Form labels': ADA_CATEGORY,
  'Landmarks': ADA_CATEGORY,
  'Lang attribute': ADA_CATEGORY,
  'Color contrast': ADA_CATEGORY,
  'Strict-Transport-Security': SECURITY_CATEGORY,
  'X-Content-Type-Options': SECURITY_CATEGORY,
  'X-Frame-Options': SECURITY_CATEGORY,
  'Content-Security-Policy': SECURITY_CATEGORY,
};

export function categoryForCheckName(name: string): string {
  return CHECK_CATEGORIES[name] ?? AI_CATEGORY;
}

export function isAdaOrSecurityCategory(category?: string): boolean {
  return category === ADA_CATEGORY || category === SECURITY_CATEGORY;
}

export function isAdaOrSecurityCheck(name: string, category?: string): boolean {
  return isAdaOrSecurityCategory(category ?? categoryForCheckName(name));
}

export const README_ADA_DISCLAIMER = `---
⚠️ **IMPORTANT NOTICE — NOT LEGAL ADVICE**

The accessibility and security checks below identify common technical
signals only. They are NOT a comprehensive compliance audit. Soren
Fixes It and Varshyl Inc. are not responsible for any legal action,
lawsuits, fines, or compliance failures arising from reliance on
these results. Accessibility and security requirements vary by
jurisdiction, industry, and audience.

We strongly recommend consulting a qualified accessibility specialist
or legal advisor to ensure your website meets all applicable
requirements including but not limited to: ADA (Americans with
Disabilities Act), WCAG 2.1, Section 508, GDPR, CCPA, and any
local, state, or federal regulations.

By using this fix package you acknowledge that these are technical
recommendations, not legal guarantees of compliance.
---`;

export const PROMPT_ADA_SECURITY_INTRO = `Before we apply these accessibility/security fixes, I need to mention:
these are common technical improvements that Soren detected, but they
are not a full legal compliance audit. Soren Fixes It is not responsible
for legal compliance — requirements vary by location and industry.
We recommend consulting an accessibility specialist or attorney for
full compliance. These fixes are a strong technical starting point.
Shall I proceed with the technical improvements?

Wait for my confirmation before continuing with accessibility or security fixes.`;
