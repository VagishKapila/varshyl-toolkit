import React, { useState } from 'react';
import { getInvitationCode } from '../api.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

export interface InvitationCodeDisplayProps {
  orgId: number;
  invitationId: number;
  containerClassName?: string;
  codeClassName?: string;
}

export function InvitationCodeDisplay({
  orgId,
  invitationId,
  containerClassName = '',
  codeClassName = '',
}: InvitationCodeDisplayProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
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
    <div
      data-testid="invitation-code-display"
      className={`inline-flex items-center gap-2 ${containerClassName}`.trim()}
      style={cssVars}
    >
      {code ? (
        <span className={`tm-code-display select-all ${codeClassName}`.trim()}>{code}</span>
      ) : (
        <button
          type="button"
          onClick={() => void handleShowCode()}
          disabled={loading}
          className="tm-link-danger text-xs underline disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Show Code'}
        </button>
      )}
      {error && <span className="tm-error text-xs">{error}</span>}
    </div>
  );
}
