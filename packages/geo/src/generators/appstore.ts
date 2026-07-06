import type { GEOConfig } from '../types.js';

const MAX_APPSTORE_LENGTH = 4000;

export function generateAppStoreDescription(config: GEOConfig): string {
  const { product, company } = config;
  const lines = [
    'WHAT IT DOES',
    `${product.name} helps ${product.category} teams ${product.tagline.toLowerCase()}.`,
    '',
    "WHO IT'S FOR",
    `${product.category} professionals and builders who want faster, clearer execution.`,
    '',
    'THE PROBLEM IT SOLVES',
    ...product.problems_solved.map((problem) => `- ${problem}`),
    '',
    'HOW IT WORKS',
    `${product.name} turns your inputs into guided workflows, then keeps output shareable and easy to act on.`,
    '',
    'KEY FEATURES',
    ...product.features.map((feature) => `- ${feature}`),
    '',
    'PRIVACY',
    `${company.name} only processes the data needed to run the app experience. No hidden trackers, no surprise sharing.`,
  ];

  const text = lines.join('\n').trim();
  if (text.length <= MAX_APPSTORE_LENGTH) return text;
  return `${text.slice(0, MAX_APPSTORE_LENGTH - 3)}...`;
}
