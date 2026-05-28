import React, { useState } from 'react';
import type { OrgRole } from '../types.js';
import { RoleSelect } from './RoleSelect.js';
import { getTeamTheme } from '../theme.js';

interface AddMemberFormProps {
  onSubmit: (data: { email: string; role: OrgRole; name?: string }) => Promise<void>;
}

export function AddMemberForm({ onSubmit }: AddMemberFormProps): React.ReactElement {
  const theme = getTeamTheme();
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
      className="rounded-lg border p-4 shadow-sm"
      style={{ backgroundColor: '#fff', borderColor: theme.brass }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: theme.fontHeading, color: theme.brick }}
      >
        Add person to org
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input
          data-testid="add-member-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={submitting}
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: theme.brass }}
        />
        <input
          data-testid="add-member-name"
          type="text"
          placeholder="Display name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          className="rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: theme.brass }}
        />
        <RoleSelect value={role} onChange={setRole} disabled={submitting} disabledRoles={['owner']} />
        <button
          data-testid="add-member-submit"
          type="submit"
          disabled={submitting || !email.trim()}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: theme.brick }}
        >
          {submitting ? 'Adding…' : 'Add to roster'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}
