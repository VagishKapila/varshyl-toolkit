import React, { useState } from 'react';
import type { OrgRole } from '../types.js';
import { createInvitation } from '../api.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import { RoleSelect } from './RoleSelect.js';
import './TeamManagementStyles.css';

export interface InviteFormProps {
  orgId: number;
  onSuccess: () => void;
  inviteFormClassName?: string;
  emailInputClassName?: string;
  submitButtonClassName?: string;
  errorClassName?: string;
  successClassName?: string;
}

export function InviteForm({
  orgId,
  onSuccess,
  inviteFormClassName = '',
  emailInputClassName = '',
  submitButtonClassName = '',
  errorClassName = '',
  successClassName = '',
}: InviteFormProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
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
    <form
      data-testid="invite-form"
      onSubmit={handleSubmit}
      className={`tm-card tm-invite-form ${inviteFormClassName}`.trim()}
      style={cssVars}
    >
      <h3 className="tm-heading text-sm mb-3">Invite a team member</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          className={`tm-input flex-1 px-3 py-2 text-sm disabled:opacity-50 ${emailInputClassName}`.trim()}
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
          data-testid="invite-submit"
          disabled={submitting || !email.trim()}
          className={`tm-button-primary px-4 py-2 text-sm ${submitButtonClassName}`.trim()}
        >
          {submitting ? 'Sending…' : 'Send Invite'}
        </button>
      </div>
      {error && (
        <p className={`tm-error mt-2 ${errorClassName}`.trim()} data-testid="invite-error">
          {error}
        </p>
      )}
      {success && (
        <p className={`tm-success mt-2 ${successClassName}`.trim()} data-testid="invite-success">
          Invitation sent successfully!
        </p>
      )}
    </form>
  );
}
