import React from 'react';
import type { OrgRole } from '../types.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export interface RoleBadgeProps {
  role: OrgRole;
  badgeClassName?: string;
}

export function RoleBadge({ role, badgeClassName = '' }: RoleBadgeProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();

  return (
    <span
      data-testid="role-badge"
      className={`tm-role-badge ${badgeClassName}`.trim()}
      style={cssVars}
    >
      {roleLabels[role]}
    </span>
  );
}
