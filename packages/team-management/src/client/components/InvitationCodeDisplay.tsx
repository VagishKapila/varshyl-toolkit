import React, { useState } from 'react';
import { getInvitationCode } from '../api.js';

interface InvitationCodeDisplayProps {
  orgId: number;
  invitationId: number;
}

export function InvitationCodeDisplay({ orgId, invitationId }: InvitationCodeDisplayProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShowCode() {
    if (code) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getInvitationCode(orgId, invitationId);
      setCode(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      {code ? (
        <span className="font-mono text-sm font-semibold tracking-widest text-slate-900 bg-slate-100 border border-slate-300 rounded px-3 py-1 select-all">
          {code}
        </span>
      ) : (
        <button
          onClick={handleShowCode}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : 'Show Code'}
        </button>
      )}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
