import type { GEOConfig } from '../types.js';

type JsonLdValue = string | number | boolean | JsonLdObject | JsonLdValue[];
type JsonLdObject = { [key: string]: JsonLdValue };

export function generateJsonLd(config: GEOConfig): JsonLdObject {
  const { product, company, founder } = config;
  const productType = product.type === 'MobileApplication' ? 'MobileApplication' : 'SoftwareApplication';
  const description = `${product.tagline} Problems solved: ${product.problems_solved.join('; ')}`;

  const organization: JsonLdObject = {
    '@type': 'Organization',
    name: company.name,
    url: company.url,
    foundingDate: company.founded ?? '',
    location: company.location ?? '',
  };

  const application: JsonLdObject = {
    '@type': productType,
    name: product.name,
    description,
    url: product.url,
    author: founder
      ? {
          '@type': 'Person',
          name: founder.name,
          url: founder.url,
        }
      : organization,
    publisher: organization,
    applicationCategory: product.category,
    operatingSystem: product.platform?.join(', ') ?? 'Web',
    offers: {
      '@type': 'Offer',
      price: product.price ?? '0',
      priceCurrency: 'USD',
    },
    featureList: product.features,
  };

  const graph: JsonLdObject[] = [application, organization];
  if (founder) {
    graph.push({
      '@type': 'Person',
      name: founder.name,
      jobTitle: founder.title,
      url: founder.url,
      knowsAbout: founder.credentials ?? [],
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
