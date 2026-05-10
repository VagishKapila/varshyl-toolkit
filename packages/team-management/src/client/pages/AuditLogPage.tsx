import React, { useState } from 'react';
import { useCurrentMembership } from '../hooks/useCurrentMembership.js';
import { AuditEventRow } from '../components/AuditEventRow.js';
import { getAuditLog } from '../api.js';
import type { AuditEvent } from '../types.js';

interface AuditLogPageProps {
  orgId: number;
}

const PAGE_SIZE = 25;

export function AuditLogPage({ orgId }: AuditLogPageProps) {
  const { membership } = useCurrentMembership();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [initialized, setInitialized] = useState(false);

  const role = membership?.role;
  const canView = role === 'owner' || role === 'admin';

  async function load(p: number, action: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLog(orgId, { page: p, limit: PAGE_SIZE, action: action || undefined });
      setEvents(result.events);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }

  // Load on first render after membership check
  React.useEffect(() => {
    if (canView && !initialized) {
      load(1, actionFilter);
    }
  }, [canView]);

  async function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    await load(1, actionFilter);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          You do not have permission to view the audit log.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Audit Log</h1>
        <form onSubmit={handleFilter} className="flex gap-2">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action…"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
          {actionFilter && (
            <button
              type="button"
              onClick={() => { setActionFilter(''); load(1, ''); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Target</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">When</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {events.map((event) => (
                  <AuditEventRow key={event.id} event={event} />
                ))}
                {events.length === 0 && initialized && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-slate-500">
                      No audit events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1, actionFilter)}
                  disabled={page <= 1 || loading}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="flex items-center px-2 text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => load(page + 1, actionFilter)}
                  disabled={page >= totalPages || loading}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
