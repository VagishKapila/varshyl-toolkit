import React from 'react';
import type { OrgRole } from '../types.js';

const ALL_ROLES: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

interface RoleSelectProps {
  value: OrgRole;
  onChange: (r: OrgRole) => void;
  disabled?: boolean;
  disabledRoles?: OrgRole[];
}

export function RoleSelect({ value, onChange, disabled, disabledRoles = [] }: RoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OrgRole)}
      disabled={disabled}
      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
    >
      {ALL_ROLES.map((r) => (
        <option key={r} value={r} disabled={disabledRoles.includes(r)}>
          {roleLabels[r]}
        </option>
      ))}
    </select>
  );
}
