import React from 'react';
import type { PublicMember, OrgRole } from '../types.js';
import { RoleBadge } from './RoleBadge.js';
import { RoleSelect } from './RoleSelect.js';

interface MemberRowProps {
  member: PublicMember;
  currentUserRole: OrgRole;
  onRemove: (userId: number) => void;
  onRoleChange: (userId: number, newRole: OrgRole) => void;
}

const canManage = (currentRole: OrgRole): boolean =>
  currentRole === 'owner' || currentRole === 'admin';

const canChangeRoleTo = (currentRole: OrgRole, targetRole: OrgRole): boolean => {
  if (currentRole === 'owner') return true;
  if (currentRole === 'admin') return targetRole !== 'owner';
  return false;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MemberRow({ member, currentUserRole, onRemove, onRoleChange }: MemberRowProps) {
  const canEdit = canManage(currentUserRole) && member.role !== 'owner';
  const disabledRoles: OrgRole[] =
    currentUserRole === 'admin' ? ['owner'] : [];

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">
            {member.name ?? member.email}
          </span>
          {member.name && (
            <span className="text-xs text-slate-500">{member.email}</span>
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
      <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
        {formatDate(member.joined_at)}
      </td>
      <td className="py-3 px-4 text-right">
        {canEdit && (
          <button
            onClick={() => onRemove(member.user_id)}
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}
