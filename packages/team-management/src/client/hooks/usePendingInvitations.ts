import { useState, useEffect, useCallback } from 'react';
import { listInvitations } from '../api.js';
import type { PendingInvitation } from '../types.js';

export function usePendingInvitations(orgId: number) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listInvitations(orgId)
      .then(setInvitations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return { invitations, loading, error, refresh: load };
}
