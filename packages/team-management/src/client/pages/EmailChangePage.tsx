import React, { useState, useEffect } from 'react';
import { requestEmailChange, verifyEmailChange, cancelEmailChange } from '../api.js';

interface EmailChangePageProps {
  /** 'request' | 'verify' | 'cancel' */
  mode: 'request' | 'verify' | 'cancel';
  token?: string;
}

export function EmailChangePage({ mode, token }: EmailChangePageProps) {
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-submit verify/cancel on mount
  useEffect(() => {
    if ((mode === 'verify' || mode === 'cancel') && token) {
      setSubmitting(true);
      const fn = mode === 'verify' ? verifyEmailChange : cancelEmailChange;
      fn(token)
        .then(() => setSuccess(true))
        .catch((e: Error) => setError(e.message))
        .finally(() => setSubmitting(false));
    }
  }, [mode, token]);

  if (mode === 'verify' || mode === 'cancel') {
    if (submitting) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4" />
            <p className="text-sm text-slate-600">
              {mode === 'verify' ? 'Verifying your email change…' : 'Cancelling email change…'}
            </p>
          </div>
        </div>
      );
    }
    if (success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {mode === 'verify' ? 'Email updated!' : 'Email change cancelled.'}
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {mode === 'verify'
                ? 'Your email address has been successfully updated.'
                : 'The email change request has been cancelled. Your email remains unchanged.'}
            </p>
            <a href="/settings" className="inline-block rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Back to Settings
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <a href="/settings" className="inline-block rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Back to Settings
          </a>
        </div>
      </div>
    );
  }

  // mode === 'request'
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestEmailChange(newEmail.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request email change');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
        <p className="text-sm text-slate-600">
          We sent a confirmation link to <strong>{newEmail}</strong>. Click the link to confirm your new email address.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Change Email Address</h1>
      <p className="text-sm text-slate-600 mb-6">
        Enter your new email address. We will send a confirmation link to verify the change.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Email Address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            disabled={submitting}
            placeholder="new@email.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !newEmail.trim()}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Sending…' : 'Send Confirmation'}
        </button>
      </form>
    </div>
  );
}
