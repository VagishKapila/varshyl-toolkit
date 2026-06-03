import React, { useState } from 'react';
import type { OwnershipTransfer } from '../types.js';
import { acceptTransfer, cancelTransfer } from '../api.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

export interface PendingTransferBannerProps {
  transfer: OwnershipTransfer;
  currentUserId: number;
  orgId: number;
  onAction: () => void;
  bannerClassName?: string;
  acceptButtonClassName?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PendingTransferBanner({
  transfer,
  currentUserId,
  orgId,
  onAction,
  bannerClassName = '',
  acceptButtonClassName = '',
}: PendingTransferBannerProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTarget = currentUserId === transfer.to_user_id;

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    try {
      await acceptTransfer(orgId);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setSubmitting(true);
    setError(null);
    try {
      await cancelTransfer(orgId);
      onAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      data-testid="pending-transfer-banner"
      className={`tm-transfer-banner shadow-sm ${bannerClassName}`.trim()}
      style={cssVars}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold tm-heading">Pending Ownership Transfer</p>
          <p className="text-sm mt-0.5">
            {isTarget
              ? 'You have been invited to become the new owner of this organization.'
              : `An ownership transfer has been initiated to user #${transfer.to_user_id}.`}
          </p>
          <p className="text-xs tm-muted mt-1">Expires {formatDate(transfer.expires_at)}</p>
        </div>
        {isTarget && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className={`tm-button-primary px-4 py-2 text-sm ${acceptButtonClassName}`.trim()}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={submitting}
              className="tm-button-ghost px-4 py-2 text-sm"
            >
              Decline
            </button>
          </div>
        )}
      </div>
      {error && <p className="tm-error mt-2">{error}</p>}
    </div>
  );
}
