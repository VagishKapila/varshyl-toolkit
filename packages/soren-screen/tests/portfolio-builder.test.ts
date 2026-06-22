import { describe, expect, it, vi } from 'vitest';
import { buildPortfolioPdf } from '../src/server/portfolio-builder.js';

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Seasoned superintendent with proven field leadership.' }],
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

describe('buildPortfolioPdf', () => {
  const data = {
    projects: 12,
    logCount: 240,
    yearsActive: 10,
    skills: ['Concrete', 'Framing', 'Safety'],
  };

  it('uses template summary without API key', async () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    mockCreate.mockClear();
    const result = await buildPortfolioPdf('user-1', 'Alex Rivera', data, {});
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
    expect(result.summary).toMatch(/Alex Rivera/);
    expect(result.pdfUrl).toMatch(/user-1\.pdf$/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls Claude Haiku when API key is set', async () => {
    mockCreate.mockClear();
    const result = await buildPortfolioPdf('user-2', 'Sam Lee', data, {
      anthropicApiKey: 'test-key',
      storageBaseUrl: 'https://cdn.example.com',
    });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.summary).toBe('Seasoned superintendent with proven field leadership.');
    expect(result.pdfUrl).toBe('https://cdn.example.com/portfolios/user-2.pdf');
  });
});
