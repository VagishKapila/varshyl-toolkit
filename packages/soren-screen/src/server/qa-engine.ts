import type { Pool } from 'pg';
import type { QAEngine, QAResult, SorenQAPair } from '../types.js';
import { getQAPairsForProduct, searchQAPairs } from './keyword-qa.js';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const SIMILARITY_THRESHOLD = 0.75;
const KEYWORD_CONFIDENCE_THRESHOLD = 0.5;
const SEED_BATCH_SIZE = 20;

export { getQAPairsForProduct, searchQAPairs } from './keyword-qa.js';

async function embedText(text: string, apiKey: string): Promise<number[]> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  const vector = response.data[0]?.embedding;
  if (!vector) throw new Error('OpenAI embedding response was empty');
  return vector;
}

async function registerPgVector(pool: Pool): Promise<void> {
  const pgvector = await import('pgvector/pg');
  await pgvector.registerTypes(pool);
}

async function countPairs(pool: Pool, productId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM np_soren_qa WHERE product_id = $1',
    [productId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function searchVector(
  pool: Pool,
  productId: string,
  queryEmbedding: number[],
): Promise<QAResult> {
  await registerPgVector(pool);
  const pgvector = await import('pgvector/pg');
  const vectorSql = pgvector.toSql(queryEmbedding);
  const result = await pool.query<{ answer: string; similarity: string }>(
    `SELECT answer, 1 - (embedding <=> $1::vector) AS similarity
     FROM np_soren_qa
     WHERE product_id = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    [vectorSql, productId],
  );
  const row = result.rows[0];
  if (!row) return { answer: '', confidence: 0, outOfScope: true };
  const confidence = Number(row.similarity);
  if (confidence < SIMILARITY_THRESHOLD) {
    return { answer: '', confidence, outOfScope: true };
  }
  return { answer: row.answer, confidence, outOfScope: false };
}

async function insertPairs(
  pool: Pool,
  productId: string,
  pairs: SorenQAPair[],
  apiKey: string,
): Promise<number> {
  await registerPgVector(pool);
  const pgvector = await import('pgvector/pg');
  let inserted = 0;

  for (let i = 0; i < pairs.length; i += SEED_BATCH_SIZE) {
    const batch = pairs.slice(i, i + SEED_BATCH_SIZE);
    for (const pair of batch) {
      const embedding = await embedText(pair.q, apiKey);
      const result = await pool.query(
        `INSERT INTO np_soren_qa (product_id, question, answer, tags, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)
         ON CONFLICT (product_id, question) DO NOTHING
         RETURNING id`,
        [productId, pair.q, pair.a, pair.tags ?? null, pgvector.toSql(embedding)],
      );
      if (result.rowCount && result.rowCount > 0) inserted += 1;
    }
  }

  return inserted;
}

export interface CreateQAEngineOptions {
  qaRegistry: Record<string, SorenQAPair[]>;
  productId: string;
  pool?: Pool;
  openaiApiKey?: string;
}

export function createQAEngine(options: CreateQAEngineOptions): QAEngine {
  const apiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;
  const vectorMode = Boolean(options.pool && apiKey);

  return {
    async search(query: string): Promise<QAResult> {
      const trimmed = query.trim();
      if (!trimmed) return { answer: '', confidence: 0, outOfScope: true };

      if (!vectorMode || !options.pool || !apiKey) {
        const pairs = getQAPairsForProduct(options.productId, options.qaRegistry);
        const result = searchQAPairs(trimmed, pairs);
        if (result.confidence < KEYWORD_CONFIDENCE_THRESHOLD) {
          return { answer: '', confidence: result.confidence, outOfScope: true };
        }
        return result;
      }

      const pairs = getQAPairsForProduct(options.productId, options.qaRegistry);
      const existing = await countPairs(options.pool, options.productId);
      if (existing === 0 && pairs.length > 0) {
        const seeded = await insertPairs(options.pool, options.productId, pairs, apiKey);
        console.log(`[soren] seeded ${seeded} Q&A pairs for ${options.productId}`);
      }

      const embedding = await embedText(trimmed, apiKey);
      return searchVector(options.pool, options.productId, embedding);
    },

    async seed(pairs: SorenQAPair[]): Promise<void> {
      if (!vectorMode || !options.pool || !apiKey) {
        console.log('[soren] keyword mode, skipping seed');
        return;
      }
      const inserted = await insertPairs(options.pool, options.productId, pairs, apiKey);
      console.log(`[soren] seeded ${inserted} Q&A pairs for ${options.productId}`);
    },
  };
}
