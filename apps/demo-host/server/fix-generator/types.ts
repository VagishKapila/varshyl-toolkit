export interface GeoAuditCheck {
  name: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  tip: string;
  category?: string;
  info?: boolean;
}

export interface GeoAudit {
  url: string;
  score: number;
  platform: string;
  checks: GeoAuditCheck[];
}

export interface SiteMetadata {
  url: string;
  platform: string;
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  orgName?: string;
  canonicalUrl?: string;
  hasAddress?: boolean;
  hasH1?: boolean;
  hasH2?: boolean;
  h1Count?: number;
  keywords?: string[];
}

export interface FixFile {
  filename: string;
  content: string;
  check: string;
  pointsRecovered: number;
}

export interface GenerateFixPackageResult {
  files: FixFile[];
  readme: string;
  prompt: string;
}

export const CHECK_POINTS: Record<string, number> = {
  'llms.txt': 20,
  'robots.txt AI crawlers': 15,
  'JSON-LD script': 15,
  'Open Graph tags': 10,
  'Twitter card tag': 5,
  'Heading structure': 10,
  'sitemap.xml': 10,
  'Canonical link': 5,
  'Schema.org entity': 10,
  'Alt text': 5,
  'Heading hierarchy': 5,
  'Form labels': 5,
  'Landmarks': 5,
  'Lang attribute': 5,
  'Strict-Transport-Security': 5,
  'X-Content-Type-Options': 3,
  'X-Frame-Options': 3,
  'Content-Security-Policy': 4,
};

export const SCORABLE_MAX_POINTS = 140;
