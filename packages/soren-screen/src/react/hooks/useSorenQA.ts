import { useCallback, useState } from 'react';
import type { SorenConfig, SorenQAResult } from '../../types.js';

const OUT_OF_SCOPE_MESSAGE =
  "That's outside what I know today. We're always adding more.";

export interface UseSorenQAResult {
  loading: boolean;
  lastResult: SorenQAResult | null;
  ask: (query: string) => Promise<SorenQAResult>;
}

export function useSorenQA(config: SorenConfig): UseSorenQAResult {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SorenQAResult | null>(null);

  const ask = useCallback(async (query: string): Promise<SorenQAResult> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { answer: '', confidence: 0, outOfScope: true };
    }

    if (typeof config.qaAdapter === 'function') {
      const result = await config.qaAdapter(trimmed);
      setLastResult(result);
      return result;
    }

    const base = config.serverUrl?.replace(/\/$/, '') ?? '';
    const product = config.productId;
    const url = `${base}/soren/qa?q=${encodeURIComponent(trimmed)}&product=${encodeURIComponent(product)}`;

    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Q&A request failed: ${res.status}`);
      const data = (await res.json()) as SorenQAResult;
      const result: SorenQAResult = data.outOfScope
        ? { ...data, answer: OUT_OF_SCOPE_MESSAGE }
        : data;
      setLastResult(result);
      return result;
    } catch {
      const fallback: SorenQAResult = {
        answer: OUT_OF_SCOPE_MESSAGE,
        confidence: 0,
        outOfScope: true,
      };
      setLastResult(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [config]);

  return { loading, lastResult, ask };
}
