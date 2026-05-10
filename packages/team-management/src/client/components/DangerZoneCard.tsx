import React, { useState } from 'react';

interface DangerZoneCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  onConfirm: () => Promise<void> | void;
  confirmPrompt?: string;
}

export function DangerZoneCard({
  title,
  description,
  buttonLabel,
  onConfirm,
  confirmPrompt,
}: DangerZoneCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = !confirmPrompt || confirmText === confirmPrompt;

  async function handleConfirm() {
    if (!isConfirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      setShowModal(false);
      setConfirmText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="border border-red-200 rounded-lg p-5 bg-red-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">{title}</h3>
            <p className="mt-1 text-sm text-red-700">{description}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
            <p className="text-sm text-slate-600 mb-4">{description}</p>

            {confirmPrompt && (
              <div className="mb-4">
                <p className="text-sm text-slate-700 mb-1">
                  Type <strong className="font-mono">{confirmPrompt}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmPrompt}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            {error && (
              <p className="mb-3 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(false); setConfirmText(''); setError(null); }}
                disabled={submitting}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isConfirmed || submitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Processing…' : buttonLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
