import React from 'react';
import type { OrgHierarchyGroup, OrgRole, PublicMember } from '../types.js';
import { RoleBadge } from './RoleBadge.js';
import { RoleSelect } from './RoleSelect.js';
import { getTeamTheme } from '../theme.js';

interface OrgPeopleRosterProps {
  hierarchy: OrgHierarchyGroup[];
  canManage: boolean;
  onRoleChange: (userId: number, role: OrgRole) => void;
  onRemove: (userId: number) => void;
}

export function OrgPeopleRoster({
  hierarchy,
  canManage,
  onRoleChange,
  onRemove,
}: OrgPeopleRosterProps): React.ReactElement {
  const theme = getTeamTheme();

  return (
    <div data-testid="org-people-roster" className="space-y-4">
      {hierarchy.map((group) => (
        <section key={group.role} data-testid={`hierarchy-${group.role}`}>
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: theme.brass, fontFamily: theme.fontHeading }}
          >
            {group.role}
          </h3>
          <ul className="rounded-lg border overflow-hidden" style={{ borderColor: theme.brass }}>
            {group.members.map((member) => (
              <OrgPeopleRow
                key={member.user_id}
                member={member}
                canManage={canManage && member.role !== 'owner'}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
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
}: {
  member: PublicMember;
  canManage: boolean;
  onRoleChange: (userId: number, role: OrgRole) => void;
  onRemove: (userId: number) => void;
}): React.ReactElement {
  const theme = getTeamTheme();

  return (
    <li
      data-testid={`member-row-${member.user_id}`}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b last:border-b-0"
      style={{ borderColor: theme.brass, backgroundColor: '#fff' }}
    >
      <div>
        <div className="text-sm font-medium" style={{ color: theme.ink }}>
          {member.name ?? member.email}
        </div>
        {member.name && (
          <div className="text-xs" style={{ color: theme.brass }}>
            {member.email}
          </div>
        )}
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
            className="text-xs font-medium"
            style={{ color: theme.brick }}
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
