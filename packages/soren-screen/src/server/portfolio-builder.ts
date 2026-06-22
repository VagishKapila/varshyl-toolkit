import type { SorenPortfolioData, SorenPortfolioPdfResult } from '../types.js';

export interface PortfolioBuilderOptions {
  anthropicApiKey?: string;
  storageBaseUrl?: string;
}

function fallbackSummary(data: SorenPortfolioData, displayName: string): string {
  return `${displayName} is an experienced construction professional with ${data.yearsActive} years in the field, ` +
    `${data.logCount} documented daily logs across ${data.projects} projects. ` +
    `Core skills include ${data.skills.slice(0, 3).join(', ') || 'site leadership'}.`;
}

/** Generate portfolio summary via Claude Haiku when API key is set; template fallback otherwise. */
export async function buildPortfolioPdf(
  userId: string,
  displayName: string,
  data: SorenPortfolioData,
  options: PortfolioBuilderOptions = {},
): Promise<SorenPortfolioPdfResult> {
  const apiKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
  let summary = fallbackSummary(data, displayName);

  if (apiKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a 3-sentence professional portfolio summary for ${displayName}, ` +
            `a construction superintendent with ${data.yearsActive} years experience, ` +
            `${data.projects} projects, and ${data.logCount} daily logs. Skills: ${data.skills.join(', ')}.`,
        }],
      });
      const block = response.content[0];
      if (block?.type === 'text') summary = block.text;
    } catch {
      // keep template summary
    }
  }

  const base = options.storageBaseUrl ?? process.env.SOREN_PDF_BASE_URL ?? 'https://storage.varshyl.local';
  const pdfUrl = `${base.replace(/\/$/, '')}/portfolios/${encodeURIComponent(userId)}.pdf`;

  return { summary, pdfUrl };
}

export async function fetchPortfolioData(
  userId: string,
  dataSource?: (userId: string) => Promise<SorenPortfolioData>,
): Promise<SorenPortfolioData> {
  if (dataSource) return dataSource(userId);
  return {
    projects: 47,
    logCount: 312,
    yearsActive: 8,
    skills: ['Concrete', 'Framing', 'Site supervision'],
  };
}
