import { useCallback, useState } from 'react';
import type { SorenConfig, SorenPortfolioData, SorenPortfolioPdfResult } from '../../types.js';

const DEMO_PORTFOLIO: SorenPortfolioData = {
  projects: 47,
  logCount: 312,
  yearsActive: 8,
  skills: ['Concrete', 'Framing', 'Site supervision'],
};

export interface UseSorenPortfolioResult {
  data: SorenPortfolioData | null;
  loading: boolean;
  pdfLoading: boolean;
  load: (userId: string) => Promise<SorenPortfolioData>;
  downloadPdf: (userId: string) => Promise<SorenPortfolioPdfResult | null>;
}

export function useSorenPortfolio(config: SorenConfig): UseSorenPortfolioResult {
  const [data, setData] = useState<SorenPortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async (userId: string): Promise<SorenPortfolioData> => {
    setLoading(true);
    try {
      if (config.portfolio?.dataSource) {
        const result = await config.portfolio.dataSource(userId);
        setData(result);
        return result;
      }
      const base = config.serverUrl?.replace(/\/$/, '') ?? '';
      if (base) {
        const res = await fetch(`${base}/soren/portfolio/${encodeURIComponent(userId)}`);
        if (res.ok) {
          const result = (await res.json()) as SorenPortfolioData;
          setData(result);
          return result;
        }
      }
      setData(DEMO_PORTFOLIO);
      return DEMO_PORTFOLIO;
    } finally {
      setLoading(false);
    }
  }, [config]);

  const downloadPdf = useCallback(async (userId: string): Promise<SorenPortfolioPdfResult | null> => {
    setPdfLoading(true);
    try {
      const base = config.serverUrl?.replace(/\/$/, '') ?? '';
      if (!base) return null;
      const res = await fetch(`${base}/soren/portfolio/${encodeURIComponent(userId)}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: config.portfolio?.pdfTemplate }),
      });
      if (!res.ok) return null;
      return (await res.json()) as SorenPortfolioPdfResult;
    } finally {
      setPdfLoading(false);
    }
  }, [config]);

  return { data, loading, pdfLoading, load, downloadPdf };
}
