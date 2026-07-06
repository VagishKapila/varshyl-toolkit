import { describe, expect, it } from 'vitest';
import { GEO } from '../src/index.js';

const config = {
  product: {
    name: 'Varshyl GEO',
    tagline: 'Generative Engine Optimization for modern products',
    url: 'https://varshyl.com/geo',
    type: 'WebApplication' as const,
    category: 'Marketing',
    features: ['llms.txt generator', 'robots.txt policy', 'JSON-LD schema'],
    problems_solved: ['Weak AI discoverability', 'Inconsistent machine-readable metadata'],
  },
  company: { name: 'Varshyl Inc.', url: 'https://varshyl.com', location: 'San Francisco' },
  founder: { name: 'Vagish Kapila', title: 'Founder', url: 'https://varshyl.com/about' },
};

describe('@varshylinc/geo generators', () => {
  const geo = new GEO(config);

  it('llmsTxt contains product name', () => {
    expect(geo.llmsTxt()).toContain(config.product.name);
  });

  it('llmsTxt contains founder name', () => {
    expect(geo.llmsTxt()).toContain(config.founder.name);
  });

  it('robotsTxt contains GPTBot', () => {
    expect(geo.robotsTxt()).toContain('GPTBot');
  });

  it('robotsTxt contains ClaudeBot', () => {
    expect(geo.robotsTxt()).toContain('ClaudeBot');
  });

  it('jsonLd returns @type: SoftwareApplication', () => {
    const graph = (geo.jsonLd() as { ['@graph']: Array<{ ['@type']: string }> })['@graph'];
    expect(graph[0]['@type']).toBe('SoftwareApplication');
  });

  it('jsonLd contains product url', () => {
    expect(JSON.stringify(geo.jsonLd())).toContain(config.product.url);
  });

  it('appStoreDescription contains WHAT IT DOES', () => {
    expect(geo.appStoreDescription()).toContain('WHAT IT DOES');
  });

  it('appStoreDescription is under 4000 chars', () => {
    expect(geo.appStoreDescription().length).toBeLessThan(4000);
  });

  it('sitemap contains product url', () => {
    expect(geo.sitemap(['/pricing'])).toContain(config.product.url);
  });

  it('GEO class instantiates correctly', () => {
    expect(new GEO(config)).toBeInstanceOf(GEO);
  });
});
