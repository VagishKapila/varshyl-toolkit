import React, { useState } from 'react';
import type { OrgRole } from '../types.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import { RoleSelect } from './RoleSelect.js';
import './TeamManagementStyles.css';

export interface AddMemberFormProps {
  onSubmit: (data: { email: string; role: OrgRole; name?: string }) => Promise<void>;
  formClassName?: string;
  submitButtonClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

export function AddMemberForm({
  onSubmit,
  formClassName = '',
  submitButtonClassName = '',
  inputClassName = '',
  errorClassName = '',
}: AddMemberFormProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        email: email.trim(),
        role,
        name: name.trim() || undefined,
      });
      setEmail('');
      setName('');
      setRole('member');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      data-testid="add-member-form"
      onSubmit={handleSubmit}
      className={`tm-card p-4 shadow-sm ${formClassName}`.trim()}
      style={cssVars}
    >
      <h3 className="tm-heading text-sm font-semibold mb-3">Add person to org</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input
          data-testid="add-member-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          className={`tm-input px-3 py-2 text-sm ${inputClassName}`.trim()}
        />
        <input
          data-testid="add-member-name"
          type="text"
          placeholder="Display name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className={`tm-input px-3 py-2 text-sm ${inputClassName}`.trim()}
        />
        <RoleSelect value={role} onChange={setRole} disabled={submitting} disabledRoles={['owner']} />
        <button
          data-testid="add-member-submit"
          type="submit"
          disabled={submitting || !email.trim()}
          className={`tm-button-primary px-4 py-2 text-sm ${submitButtonClassName}`.trim()}
        >
          {submitting ? 'Adding…' : 'Add to roster'}
        </button>
      </div>
      {error && (
        <p className={`tm-error mt-2 ${errorClassName}`.trim()} data-testid="add-member-error">
          {error}
        </p>
      )}
    </form>
  );
}
