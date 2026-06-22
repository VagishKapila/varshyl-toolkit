import { describe, expect, it } from 'vitest';
import { JOBSITE_QA } from '../src/adapters/jobsite/qa.generated.js';
import { REFERENCE_QA } from '../src/adapters/reference/qa.js';
import { searchQAPairs } from '../src/server/qa-engine.js';

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
