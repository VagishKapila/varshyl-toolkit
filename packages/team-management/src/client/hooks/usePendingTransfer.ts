import { useState, useEffect, useCallback } from 'react';
import { getPendingTransfer } from '../api.js';
import type { OwnershipTransfer } from '../types.js';

export function usePendingTransfer(orgId: number) {
  const [transfer, setTransfer] = useState<OwnershipTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getPendingTransfer(orgId)
      .then(setTransfer)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    load();
    // Poll every 30 seconds for transfer status changes
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return { transfer, loading, error, refresh: load };
}
