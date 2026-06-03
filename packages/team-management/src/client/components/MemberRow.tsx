import React from 'react';
import type { PublicMember, OrgRole } from '../types.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import { RoleBadge } from './RoleBadge.js';
import { RoleSelect } from './RoleSelect.js';
import './TeamManagementStyles.css';

export interface MemberRowProps {
  member: PublicMember;
  currentUserRole: OrgRole;
  onRemove: (userId: number) => void;
  onRoleChange: (userId: number, newRole: OrgRole) => void;
  memberRowClassName?: string;
  removeButtonClassName?: string;
}

const canManage = (currentRole: OrgRole): boolean =>
  currentRole === 'owner' || currentRole === 'admin';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MemberRow({
  member,
  currentUserRole,
  onRemove,
  onRoleChange,
  memberRowClassName = '',
  removeButtonClassName = '',
}: MemberRowProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
  const canEdit = canManage(currentUserRole) && member.role !== 'owner';
  const disabledRoles: OrgRole[] = currentUserRole === 'admin' ? ['owner'] : [];

  return (
    <tr
      data-testid={`member-row-${member.user_id}`}
      className={`tm-member-row last:border-0 transition-colors ${memberRowClassName}`.trim()}
      style={cssVars}
    >
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--tm-ink)' }}>
            {member.name ?? member.email}
          </span>
          {member.name && (
            <span className="text-xs tm-muted">{member.email}</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        {canEdit ? (
          <RoleSelect
            value={member.role}
            onChange={(r) => onRoleChange(member.user_id, r)}
            disabledRoles={disabledRoles}
          />
        ) : (
          <RoleBadge role={member.role} />
        )}
      </td>
      <td className="py-3 px-4 text-sm tm-muted whitespace-nowrap">
        {formatDate(member.joined_at)}
      </td>
      <td className="py-3 px-4 text-right">
        {canEdit && (
          <button
            type="button"
            onClick={() => onRemove(member.user_id)}
            className={`tm-link-danger text-sm ${removeButtonClassName}`.trim()}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}
