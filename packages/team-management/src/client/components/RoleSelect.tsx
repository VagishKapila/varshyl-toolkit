import React from 'react';
import type { OrgRole } from '../types.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

const ALL_ROLES: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export interface RoleSelectProps {
  value: OrgRole;
  onChange: (r: OrgRole) => void;
  disabled?: boolean;
  disabledRoles?: OrgRole[];
  selectClassName?: string;
}

export function RoleSelect({
  value,
  onChange,
  disabled,
  disabledRoles = [],
  selectClassName = '',
}: RoleSelectProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();

  return (
    <select
      data-testid="role-select"
      value={value}
      onChange={(e) => onChange(e.target.value as OrgRole)}
      disabled={disabled}
      className={`tm-select block w-full px-3 py-1.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${selectClassName}`.trim()}
      style={cssVars}
    >
      {ALL_ROLES.map((r) => (
        <option key={r} value={r} disabled={disabledRoles.includes(r)}>
          {roleLabels[r]}
        </option>
      ))}
    </select>
  );
}
