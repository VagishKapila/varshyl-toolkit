import type {
  PortfolioData,
  SorenPortfolioConfig,
  SorenPortfolioData,
  SorenPortfolioPdfResult,
} from '../types.js';
import { renderPortfolioPdf } from './portfolio-pdf.js';

export interface PortfolioBuilderOptions {
  anthropicApiKey?: string;
  portfolio?: SorenPortfolioConfig;
}

export interface PortfolioPdfBuildResult {
  pdfBuffer: Uint8Array | null;
  url: string | null;
  filename: string;
  summary: string;
}

function fallbackSummary(data: PortfolioData): string {
  const name = `${data.firstName} ${data.lastName}`.trim();
  const skills = data.skills?.slice(0, 3).join(', ') || 'site leadership';
  return `${name} is an experienced construction professional with ${data.yearsActive} years in the field, ` +
    `${data.logCount} documented daily logs across ${data.projectCount} projects. ` +
    `Core skills include ${skills}.`;
}

async function resolveSummary(data: PortfolioData, apiKey?: string): Promise<string> {
  if (data.summary) return data.summary;
  const name = `${data.firstName} ${data.lastName}`.trim();
  let summary = fallbackSummary(data);
  if (!apiKey) return summary;

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a 3-sentence professional portfolio summary for ${name}, ` +
          `${data.title} with ${data.yearsActive} years experience, ` +
          `${data.projectCount} projects, and ${data.logCount} daily logs. ` +
          `Skills: ${(data.skills ?? []).join(', ') || 'general construction'}.`,
      }],
    });
    const block = response.content[0];
    if (block?.type === 'text') summary = block.text;
  } catch {
    // keep template summary
  }
  return summary;
}

function portfolioFilename(userId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `portfolio-${userId}-${date}.pdf`;
}

/** Generate portfolio PDF via pdf-lib; optional host storage upload. */
export async function buildPortfolioPdf(
  data: PortfolioData,
  options: PortfolioBuilderOptions = {},
): Promise<PortfolioPdfBuildResult> {
  const apiKey = options.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
  const summary = await resolveSummary(data, apiKey);
  const pdfBuffer = await renderPortfolioPdf(data, summary);
  const filename = portfolioFilename(data.userId);
  const storage = options.portfolio?.storage;

  if (storage) {
    const url = await storage.upload(pdfBuffer, filename, 'application/pdf');
    return { pdfBuffer: null, url, filename, summary };
  }

  return { pdfBuffer, url: null, filename, summary };
}

export function toSorenPortfolioData(data: PortfolioData): SorenPortfolioData {
  return {
    projects: data.projectCount,
    logCount: data.logCount,
    yearsActive: data.yearsActive,
    skills: data.skills ?? [],
  };
}

function normalizePortfolioData(
  userId: string,
  raw: PortfolioData | SorenPortfolioData,
): PortfolioData {
  if ('projectCount' in raw) return raw;
  return {
    userId,
    firstName: 'Professional',
    lastName: '',
    title: 'Construction Superintendent',
    yearsActive: raw.yearsActive,
    projectCount: raw.projects,
    logCount: raw.logCount,
    skills: raw.skills,
  };
}

export async function fetchPortfolioData(
  userId: string,
  dataSource?: (userId: string) => Promise<PortfolioData | SorenPortfolioData>,
): Promise<PortfolioData> {
  if (dataSource) return normalizePortfolioData(userId, await dataSource(userId));
  return {
    userId,
    firstName: 'Professional',
    lastName: '',
    title: 'Construction Superintendent',
    yearsActive: 8,
    projectCount: 47,
    logCount: 312,
    skills: ['Concrete', 'Framing', 'Site supervision'],
  };
}

/** API response shape for POST /portfolio/:userId/pdf */
export function toPdfApiResponse(result: PortfolioPdfBuildResult): SorenPortfolioPdfResult {
  return {
    url: result.url,
    filename: result.filename,
    generated: true,
  };
}
