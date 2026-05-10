import React, { useState } from 'react';
import type { OrgRole } from '../types.js';
import { createInvitation } from '../api.js';
import { RoleSelect } from './RoleSelect.js';

interface InviteFormProps {
  orgId: number;
  onSuccess: () => void;
}

export function InviteForm({ orgId, onSuccess }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await createInvitation(orgId, { email: email.trim(), role });
      setEmail('');
      setRole('member');
      setSuccess(true);
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Invite a team member</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
        />
        <div className="w-full sm:w-36">
          <RoleSelect
            value={role}
            onChange={setRole}
            disabled={submitting}
            disabledRoles={['owner']}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Sending…' : 'Send Invite'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-sm text-green-600">Invitation sent successfully!</p>
      )}
    </form>
  );
}
