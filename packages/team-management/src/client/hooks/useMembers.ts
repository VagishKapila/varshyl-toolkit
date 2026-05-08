import { useState, useEffect, useCallback } from 'react';
import { listMembers } from '../api.js';
import type { PublicMember } from '../types.js';

export function useMembers(orgId: number, opts?: { includeFormer?: boolean }) {
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listMembers(orgId, opts)
      .then(setMembers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId, opts?.includeFormer]);

  useEffect(() => {
    load();
  }, [load]);

  return { members, loading, error, refresh: load };
}
