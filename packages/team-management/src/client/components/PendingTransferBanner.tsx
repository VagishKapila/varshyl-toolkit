import React, { useState } from 'react';
import type { OwnershipTransfer } from '../types.js';
import { acceptTransfer, cancelTransfer } from '../api.js';

interface PendingTransferBannerProps {
  transfer: OwnershipTransfer;
  currentUserId: number;
  orgId: number;
  onAction: () => void;
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
}: PendingTransferBannerProps) {
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
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Pending Ownership Transfer
          </p>
          <p className="text-sm text-amber-800 mt-0.5">
            {isTarget
              ? `You have been invited to become the new owner of this organization.`
              : `An ownership transfer has been initiated to user #${transfer.to_user_id}.`}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Expires {formatDate(transfer.expires_at)}
          </p>
        </div>
        {isTarget && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleAccept}
              disabled={submitting}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={submitting}
              className="rounded-md border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
