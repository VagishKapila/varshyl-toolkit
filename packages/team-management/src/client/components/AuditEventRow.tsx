import React from 'react';
import type { AuditEvent } from '../types.js';

interface AuditEventRowProps {
  event: AuditEvent;
}

function humanizeAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditEventRow({ event }: AuditEventRowProps) {
  const isAdminAction = event.actor_type === 'super_admin';

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isAdminAction ? 'text-purple-700' : 'text-slate-900'}`}>
            {event.actor_display_name}
          </span>
          {isAdminAction && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
              Support
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-slate-700">{humanizeAction(event.action)}</span>
      </td>
      <td className="py-3 px-4">
        {event.target_type && event.target_id ? (
          <span className="text-xs text-slate-500">
            {event.target_type} #{event.target_id}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
        {formatTimestamp(event.created_at)}
      </td>
    </tr>
  );
}
