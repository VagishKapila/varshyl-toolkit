import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { JOBSITE_QA } from '../src/adapters/jobsite/qa.generated.js';
import { REFERENCE_QA } from '../src/adapters/reference/qa.js';
import { createQAEngine, searchQAPairs } from '../src/server/qa-engine.js';

const mockEmbeddingsCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    embeddings: { create: mockEmbeddingsCreate },
  })),
}));

vi.mock('pgvector/pg', () => ({
  registerTypes: vi.fn().mockResolvedValue(undefined),
  toSql: (vector: number[]) => `[${vector.join(',')}]`,
  default: {
    registerTypes: vi.fn().mockResolvedValue(undefined),
    toSql: (vector: number[]) => `[${vector.join(',')}]`,
  },
}));

function makeVector(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => Math.sin(seed + i * 0.01));
}

function makePool(queryImpl: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>): Pool {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (typeof sql === 'string' && sql.includes('pg_type')) {
      return { rows: [{ typname: 'vector', oid: 1 }] };
    }
    return queryImpl(sql, params);
  });
  return {
    query,
    setTypeParser: vi.fn(),
  } as unknown as Pool;
}

describe('searchQAPairs', () => {
  it('exports 200 JobSite Q&A pairs', () => {
    expect(JOBSITE_QA).toHaveLength(200);
  });

  it.each([
    'How do I create a daily log?',
    'download my PDF report',
    'voice note too short',
    'add photos to a log',
    'Where does the weather come from',
    'add team members',
    'How much does JobSite Intel cost',
    'Build Book closeout',
    'notify my client',
    'use this in Spanish',
  ])('matches JobSite question: %s', (query) => {
    const result = searchQAPairs(query, JOBSITE_QA);
    expect(result.outOfScope).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it.each([
    'What is the capital of France?',
    'pizza recipe margherita',
    'quantum entanglement explained',
    'best dog training techniques',
    'how to knit a sweater',
  ])('returns out of scope for: %s', (query) => {
    const result = searchQAPairs(query, JOBSITE_QA);
    expect(result.outOfScope).toBe(true);
  });

  it('matches reference adapter demo pairs', () => {
    const result = searchQAPairs('What is Soren', REFERENCE_QA);
    expect(result.outOfScope).toBe(false);
    expect(result.answer).toMatch(/demo AI assistant/i);
  });
});

describe('createQAEngine pgvector mode', () => {
  beforeEach(() => {
    mockEmbeddingsCreate.mockReset();
    mockEmbeddingsCreate.mockImplementation(async ({ input }: { input: string }) => ({
      data: [{ embedding: makeVector(input.length) }],
    }));
  });

  it('returns answer when vector similarity is high', async () => {
    const pool = makePool(async () => ({
      rows: [{ answer: 'Tap New Log on the home screen.', similarity: '0.92' }],
      rowCount: 1,
    }));
    const engine = createQAEngine({
      qaRegistry: { jobsite: JOBSITE_QA.slice(0, 1) },
      productId: 'jobsite',
      pool,
      openaiApiKey: 'test-key',
    });

    const result = await engine.search('log today work');
    expect(result.outOfScope).toBe(false);
    expect(result.answer).toContain('New Log');
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('returns outOfScope when vector similarity is low', async () => {
    const pool = makePool(async (sql) => {
      if (sql.includes('COUNT')) return { rows: [{ count: '1' }] };
      return { rows: [{ answer: 'irrelevant', similarity: '0.2' }] };
    });
    const engine = createQAEngine({
      qaRegistry: { jobsite: JOBSITE_QA.slice(0, 1) },
      productId: 'jobsite',
      pool,
      openaiApiKey: 'test-key',
    });

    const result = await engine.search('unrelated topic');
    expect(result.outOfScope).toBe(true);
  });

  it('auto-seeds on first search when table is empty', async () => {
    let insertCount = 0;
    const pool = makePool(async (sql) => {
      if (sql.includes('COUNT')) return { rows: [{ count: '0' }] };
      if (sql.includes('INSERT')) {
        insertCount += 1;
        return { rows: [{ id: '1' }], rowCount: 1 };
      }
      return { rows: [{ answer: 'Seeded answer', similarity: '0.9' }] };
    });
    const engine = createQAEngine({
      qaRegistry: { jobsite: JOBSITE_QA.slice(0, 2) },
      productId: 'jobsite',
      pool,
      openaiApiKey: 'test-key',
    });

    await engine.search('daily log');
    expect(insertCount).toBe(2);
  });
});

describe('createQAEngine keyword fallback', () => {
  it('works without pool using keyword overlap', async () => {
    const engine = createQAEngine({
      qaRegistry: { jobsite: JOBSITE_QA },
      productId: 'jobsite',
    });
    const result = await engine.search('How do I create a daily log?');
    expect(result.outOfScope).toBe(false);
    expect(result.answer.length).toBeGreaterThan(0);
  });
});

describe('createQAEngine seed', () => {
  beforeEach(() => {
    mockEmbeddingsCreate.mockReset();
    mockEmbeddingsCreate.mockImplementation(async ({ input }: { input: string }) => ({
      data: [{ embedding: makeVector(input.length) }],
    }));
  });

  it('batches inserts and skips duplicates', async () => {
    const pairs = JOBSITE_QA.slice(0, 25);
    let inserts = 0;
    const pool = makePool(async (sql) => {
      if (sql.includes('INSERT')) {
        inserts += 1;
        const duplicate = inserts === 3;
        return { rows: duplicate ? [] : [{ id: String(inserts) }], rowCount: duplicate ? 0 : 1 };
      }
      return { rows: [] };
    });
    const engine = createQAEngine({
      qaRegistry: { jobsite: pairs },
      productId: 'jobsite',
      pool,
      openaiApiKey: 'test-key',
    });

    await engine.seed(pairs);
    expect(inserts).toBe(25);
  });
});
