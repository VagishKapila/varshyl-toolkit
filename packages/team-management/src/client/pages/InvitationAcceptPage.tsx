import React, { useEffect, useState } from 'react';
import { acceptInvitationByToken } from '../api.js';
import type { OrgRole } from '../types.js';

interface InvitationAcceptPageProps {
  /** The magic-link token, typically extracted from the URL query string */
  token: string;
  /** Whether the current user is authenticated */
  isAuthenticated: boolean;
  loginUrl?: string;
  signupUrl?: string;
}

type State =
  | { status: 'loading' }
  | { status: 'success'; orgId: number; role: OrgRole }
  | { status: 'already_member'; message: string }
  | { status: 'error'; message: string }
  | { status: 'unauthenticated' };

export function InvitationAcceptPage({
  token,
  isAuthenticated,
  loginUrl = '/login',
  signupUrl = '/signup',
}: InvitationAcceptPageProps) {
  const [state, setState] = useState<State>(
    isAuthenticated ? { status: 'loading' } : { status: 'unauthenticated' }
  );

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    acceptInvitationByToken(token)
      .then(({ orgId, role }) => setState({ status: 'success', orgId, role }))
      .catch((err: Error) => {
        const msg = err.message ?? 'Something went wrong';
        if (msg.includes('already') || msg.includes('member')) {
          setState({ status: 'already_member', message: msg });
        } else {
          setState({ status: 'error', message: msg });
        }
      });
  }, [token, isAuthenticated]);

  if (state.status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">You have been invited!</h1>
          <p className="text-sm text-slate-600 mb-6">
            Please log in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`${loginUrl}?redirect_token=${encodeURIComponent(token)}`}
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 text-center transition-colors"
            >
              Log In
            </a>
            <a
              href={`${signupUrl}?redirect_token=${encodeURIComponent(token)}`}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-4" />
          <p className="text-sm text-slate-600">Accepting your invitation…</p>
        </div>
      </div>
    );
  }

  if (state.status === 'success') {
    const roleLabels: Record<OrgRole, string> = {
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      viewer: 'Viewer',
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Welcome aboard!</h1>
          <p className="text-sm text-slate-600 mb-6">
            You have joined the organization as <strong>{roleLabels[state.role]}</strong>.
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

  if (state.status === 'already_member') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Already a member</h1>
          <p className="text-sm text-slate-600 mb-6">{state.message}</p>
          <a
            href="/"
            className="inline-block rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation failed</h1>
        <p className="text-sm text-slate-600 mb-6">
          {'message' in state ? state.message : 'This invitation link is invalid or has expired.'}
        </p>
        <a
          href="/"
          className="inline-block rounded-md border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
