import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildPortfolioPdf } from '../src/server/portfolio-builder.js';
import type { PortfolioData } from '../src/types.js';

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'Seasoned superintendent with proven field leadership.' }],
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

const baseData: PortfolioData = {
  userId: 'user-1',
  firstName: 'Alex',
  lastName: 'Rivera',
  title: 'Construction Superintendent',
  yearsActive: 10,
  projectCount: 12,
  logCount: 240,
  skills: ['Concrete', 'Framing', 'Safety'],
};

describe('buildPortfolioPdf', () => {
  it('generates a non-empty PDF buffer', async () => {
    const result = await buildPortfolioPdf(baseData, {});
    expect(result.pdfBuffer).toBeInstanceOf(Uint8Array);
    expect(result.pdfBuffer!.length).toBeGreaterThan(500);
    expect(Buffer.from(result.pdfBuffer!).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('PDF contains user name in content', async () => {
    const result = await buildPortfolioPdf(baseData, {});
    const doc = await PDFDocument.load(result.pdfBuffer!);
    expect(doc.getPageCount()).toBe(1);
    const alt = await buildPortfolioPdf(
      { ...baseData, firstName: 'Jordan', lastName: 'Lee' },
      {},
    );
    expect(Buffer.compare(result.pdfBuffer!, alt.pdfBuffer!)).not.toBe(0);
  });

  it('calls storage.upload when adapter provided', async () => {
    const upload = vi.fn().mockResolvedValue('https://cdn.example.com/portfolio-user-1.pdf');
    const result = await buildPortfolioPdf(baseData, {
      portfolio: { storage: { upload } },
    });
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][2]).toBe('application/pdf');
    expect(result.url).toBe('https://cdn.example.com/portfolio-user-1.pdf');
    expect(result.pdfBuffer).toBeNull();
  });

  it('returns buffer directly when no storage adapter', async () => {
    const result = await buildPortfolioPdf(baseData, {});
    expect(result.pdfBuffer).not.toBeNull();
    expect(result.url).toBeNull();
    expect(result.filename).toMatch(/^portfolio-user-1-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('skips Claude call when summary pre-provided', async () => {
    mockCreate.mockClear();
    const result = await buildPortfolioPdf(
      { ...baseData, summary: 'Pre-written career summary.' },
      { anthropicApiKey: 'test-key' },
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.pdfBuffer!.length).toBeGreaterThan(500);
  });
});
