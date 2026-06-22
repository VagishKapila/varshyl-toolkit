import type { SorenQAPair, SorenQAResult } from '../types.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'do', 'i', 'my', 'to', 'how', 'what', 'can', 'does', 'it',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function scorePair(queryTokens: string[], pair: SorenQAPair): number {
  const questionTokens = tokenize(pair.q);
  if (questionTokens.length === 0 || queryTokens.length === 0) return 0;
  let hits = 0;
  for (const token of queryTokens) {
    if (questionTokens.some((qt) => qt.includes(token) || token.includes(qt))) {
      hits += 1;
    }
  }
  return hits / Math.max(queryTokens.length, questionTokens.length);
}

/** Keyword Q&A search — v1, no pgvector or Claude. */
export function searchQAPairs(query: string, pairs: SorenQAPair[]): SorenQAResult {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { answer: '', confidence: 0, outOfScope: true };
  }

  let best: SorenQAPair | null = null;
  let bestScore = 0;

  for (const pair of pairs) {
    const score = scorePair(queryTokens, pair);
    if (score > bestScore) {
      bestScore = score;
      best = pair;
    }
  }

  if (!best || bestScore < 0.4) {
    return { answer: '', confidence: bestScore, outOfScope: true };
  }

  return { answer: best.a, confidence: bestScore, outOfScope: false };
}

export function getQAPairsForProduct(
  productId: string,
  registry: Record<string, SorenQAPair[]>,
): SorenQAPair[] {
  return registry[productId] ?? [];
}
