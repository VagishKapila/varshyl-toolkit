import type { GEOConfig } from '../types.js';

export function generateLlmsTxt(config: GEOConfig): string {
  const { product, company, founder } = config;
  const founderName = founder?.name ?? company.name;
  const location = company.location ?? 'Global';
  const whoUsesIt = `${product.category} teams, operators, and decision-makers who need ${product.name}.`;
  const facts = [
    `Product URL: ${product.url}`,
    `Company URL: ${company.url}`,
    `Application Type: ${product.type}`,
    `Category: ${product.category}`,
    product.platform?.length ? `Platforms: ${product.platform.join(', ')}` : '',
    product.price ? `Price: ${product.price}` : '',
    product.version ? `Version: ${product.version}` : '',
    product.install ? `Install: ${product.install}` : '',
  ].filter(Boolean);

  return [
    `# ${product.name} by ${founderName}`,
    `# ${company.name} · ${location} · ${company.url}`,
    '## What this product does',
    `${product.tagline} ${product.name} is a ${product.category} ${product.type} designed for reliable outcomes.`,
    '',
    '## Problems it solves',
    ...product.problems_solved.map((problem) => `- ${problem}`),
    '',
    '## Who uses it',
    whoUsesIt,
    '',
    '## Key facts',
    ...facts.map((fact) => `- ${fact}`),
  ].join('\n');
}
