import React from 'react';
import type { OrgHierarchyGroup, OrgRole, PublicMember } from '../types.js';
import { useTeamManagementTheme } from '../team-management-theme.js';
import { RoleBadge } from './RoleBadge.js';
import { RoleSelect } from './RoleSelect.js';
import './TeamManagementStyles.css';

export interface OrgPeopleRosterProps {
  hierarchy: OrgHierarchyGroup[];
  canManage: boolean;
  onRoleChange: (userId: number, role: OrgRole) => void;
  onRemove: (userId: number) => void;
  rosterClassName?: string;
  memberRowClassName?: string;
}

export function OrgPeopleRoster({
  hierarchy,
  canManage,
  onRoleChange,
  onRemove,
  rosterClassName = '',
  memberRowClassName = '',
}: OrgPeopleRosterProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();

  return (
    <div
      data-testid="org-people-roster"
      className={`space-y-4 ${rosterClassName}`.trim()}
      style={cssVars}
    >
      {hierarchy.map((group) => (
        <section key={group.role} data-testid={`hierarchy-${group.role}`}>
          <h3 className="tm-heading text-xs font-semibold uppercase tracking-wide mb-2 tm-muted">
            {group.role}
          </h3>
          <ul className="tm-card rounded-lg overflow-hidden">
            {group.members.map((member) => (
              <OrgPeopleRow
                key={member.user_id}
                member={member}
                canManage={canManage && member.role !== 'owner'}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
                memberRowClassName={memberRowClassName}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function OrgPeopleRow({
  member,
  canManage,
  onRoleChange,
  onRemove,
  memberRowClassName,
}: {
  member: PublicMember;
  canManage: boolean;
  onRoleChange: (userId: number, role: OrgRole) => void;
  onRemove: (userId: number) => void;
  memberRowClassName?: string;
}): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();

  return (
    <li
      data-testid={`member-row-${member.user_id}`}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 tm-member-row last:border-b-0 ${memberRowClassName ?? ''}`.trim()}
      style={cssVars}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--tm-ink)' }}>
          {member.name ?? member.email}
        </div>
        {member.name && <div className="text-xs tm-muted">{member.email}</div>}
      </div>
      <div className="flex items-center gap-3">
        {canManage ? (
          <RoleSelect
            value={member.role}
            onChange={(r) => onRoleChange(member.user_id, r)}
            disabledRoles={['owner']}
          />
        ) : (
          <RoleBadge role={member.role} />
        )}
        {canManage && (
          <button
            data-testid={`remove-member-${member.user_id}`}
            type="button"
            onClick={() => onRemove(member.user_id)}
            className="tm-link-danger text-xs"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
