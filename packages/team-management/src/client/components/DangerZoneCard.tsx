import React, { useState } from 'react';
import { useTeamManagementTheme } from '../team-management-theme.js';
import './TeamManagementStyles.css';

export interface DangerZoneCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  onConfirm: () => Promise<void> | void;
  confirmPrompt?: string;
  cardClassName?: string;
  modalClassName?: string;
  confirmButtonClassName?: string;
}

export function DangerZoneCard({
  title,
  description,
  buttonLabel,
  onConfirm,
  confirmPrompt,
  cardClassName = '',
  modalClassName = '',
  confirmButtonClassName = '',
}: DangerZoneCardProps): React.ReactElement {
  const { cssVars } = useTeamManagementTheme();
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
      <div
        data-testid="danger-zone-card"
        className={`tm-danger-zone ${cardClassName}`.trim()}
        style={cssVars}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="tm-danger-zone__title">{title}</h3>
            <p className="mt-1 text-sm tm-muted">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="tm-button-ghost shrink-0 px-4 py-2 text-sm font-medium"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className={`tm-card w-full max-w-md p-6 shadow-2xl ${modalClassName}`.trim()}
            style={cssVars}
          >
            <h2 className="tm-heading text-lg font-semibold mb-2">{title}</h2>
            <p className="text-sm tm-muted mb-4">{description}</p>

            {confirmPrompt && (
              <div className="mb-4">
                <p className="text-sm mb-1">
                  Type <strong className="font-mono">{confirmPrompt}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmPrompt}
                  className="tm-input w-full px-3 py-2 text-sm"
                />
              </div>
            )}

            {error && <p className="tm-error mb-3">{error}</p>}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setConfirmText('');
                  setError(null);
                }}
                disabled={submitting}
                className="tm-button-ghost px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmed || submitting}
                className={`tm-button-primary px-4 py-2 text-sm ${confirmButtonClassName}`.trim()}
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
