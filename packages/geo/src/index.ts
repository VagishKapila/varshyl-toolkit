import { generateAppStoreDescription } from './generators/appstore.js';
import { generateJsonLd } from './generators/json-ld.js';
import { generateLlmsTxt } from './generators/llms-txt.js';
import { generateRobotsTxt } from './generators/robots-txt.js';
import { generateSitemap } from './generators/sitemap.js';
import type { GEOCompanyConfig, GEOConfig, GEOFounderConfig, GEOProductConfig } from './types.js';

export const VERSION = '0.1.0' as const;

export class GEO {
  constructor(private readonly config: GEOConfig) {}

  llmsTxt(): string {
    return generateLlmsTxt(this.config);
  }

  robotsTxt(): string {
    return generateRobotsTxt();
  }

  jsonLd(): object {
    return generateJsonLd(this.config);
  }

  sitemap(routes: string[]): string {
    return generateSitemap(this.config.product.url, routes);
  }

  appStoreDescription(): string {
    return generateAppStoreDescription(this.config);
  }

  nextMetadata(): object {
    const { product, company } = this.config;
    const description = product.tagline;
    return {
      title: product.name,
      description,
      alternates: { canonical: product.url },
      openGraph: {
        title: product.name,
        description,
        url: product.url,
        type: 'website',
        siteName: company.name,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description,
      },
      other: {
        robots: 'index,follow',
      },
    };
  }
}

export type { GEOCompanyConfig, GEOConfig, GEOFounderConfig, GEOProductConfig };
