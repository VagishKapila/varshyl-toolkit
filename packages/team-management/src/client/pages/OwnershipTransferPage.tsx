import React, { useState } from 'react';
import { usePendingTransfer } from '../hooks/usePendingTransfer.js';
import { useCurrentMembership } from '../hooks/useCurrentMembership.js';
import { acceptTransfer, cancelTransfer } from '../api.js';

interface OwnershipTransferPageProps {
  orgId: number;
}

export function OwnershipTransferPage({ orgId }: OwnershipTransferPageProps) {
  const { transfer, loading, error } = usePendingTransfer(orgId);
  const { membership } = useCurrentMembership();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState<'accepted' | 'cancelled' | null>(null);

  const userEmail = membership ? (membership as { email?: string }).email ?? '' : '';
  const isTarget = transfer?.to_user_id === membership?.user_id;
  const emailConfirmed = confirmEmail.trim().toLowerCase() === userEmail.toLowerCase();

  async function handleAccept() {
    if (!emailConfirmed) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await acceptTransfer(orgId);
      setDone('accepted');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to accept transfer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setSubmitting(true);
    setActionError(null);
    try {
      await cancelTransfer(orgId);
      setDone('cancelled');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel transfer');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (done === 'accepted') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ownership transferred!</h1>
        <p className="text-sm text-slate-600 mb-6">You are now the owner of this organization.</p>
        <a href={`/orgs/${orgId}`} className="inline-block rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Go to Organization
        </a>
      </div>
    );
  }

  if (done === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Transfer cancelled.</h1>
        <a href={`/orgs/${orgId}`} className="inline-block rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Back to Organization
        </a>
      </div>
    );
  }

  if (!transfer || !isTarget) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
          No pending ownership transfer found for you.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Accept Ownership</h1>
      <p className="text-sm text-slate-600 mb-6">
        You are being offered ownership of this organization. Accepting grants you full owner privileges.
      </p>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Owner Powers You Will Receive</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {[
            'Delete the organization',
            'Appoint and demote admins',
            'Transfer ownership to others',
            'Override all member permissions',
          ].map((power) => (
            <li key={power} className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {power}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Type your email address to confirm:
        </label>
        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={userEmail || 'your@email.com'}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={!emailConfirmed || submitting}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Processing…' : 'Accept Ownership'}
        </button>
        <button
          onClick={handleCancel}
          disabled={submitting}
          className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

