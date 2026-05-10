import { useState, useEffect, useCallback } from 'react';
import { getMyMembership } from '../api.js';
import type { CurrentMembership } from '../types.js';

export function useCurrentMembership() {
  const [membership, setMembership] = useState<CurrentMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMyMembership()
      .then(setMembership)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { membership, loading, error, refresh: load };
}
