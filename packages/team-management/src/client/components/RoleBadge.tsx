import React from 'react';
import type { OrgRole } from '../types.js';

const roleStyles: Record<OrgRole, string> = {
  owner: 'bg-purple-100 text-purple-800 border border-purple-300',
  admin: 'bg-blue-100 text-blue-800 border border-blue-300',
  member: 'bg-green-100 text-green-800 border border-green-300',
  viewer: 'bg-slate-100 text-slate-700 border border-slate-300',
};

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export function RoleBadge({ role }: { role: OrgRole }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}
