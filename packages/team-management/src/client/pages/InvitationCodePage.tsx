import React, { useState } from 'react';
import { acceptInvitationByCode } from '../api.js';
import type { OrgRole } from '../types.js';

interface InvitationCodePageProps {
  prefillEmail?: string;
}

type State =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; orgId: number; role: OrgRole }
  | { status: 'error'; message: string };

export function InvitationCodePage({ prefillEmail = '' }: InvitationCodePageProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [code, setCode] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const result = await acceptInvitationByCode(email.trim(), code.trim());
      setState({ status: 'success', ...result });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Invalid code' });
    }
  }

  if (state.status === 'success') {
    const roleLabels: Record<OrgRole, string> = {
      owner: 'Owner', admin: 'Admin', member: 'Member', viewer: 'Viewer',
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">You're in!</h1>
          <p className="text-sm text-slate-600 mb-6">
            You joined as <strong>{roleLabels[state.role]}</strong>.
          </p>
          <a
            href={`/orgs/${state.orgId}`}
            className="inline-block rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to Organization
          </a>
        </div>
      </div>
    );
  }

  const submitting = state.status === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Enter Invitation Code</h1>
        <p className="text-sm text-slate-600 mb-6">
          Enter the email address your invitation was sent to and the 6-digit code you received.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              placeholder="you@company.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={submitting}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono tracking-widest text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>
          {state.status === 'error' && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
          <button
            type="submit"
            disabled={submitting || code.length !== 6 || !email.trim()}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Verifying…' : 'Accept Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
