import { useState, type CSSProperties, type ReactElement } from 'react';
import type { SorenConfirmPayload } from '@varshylinc/soren-core';
import { useSoren } from './SorenProvider.js';
import { sizes, tokens } from './styles.js';

export interface SorenConfirmRowProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders the pending `confirm` action (e.g. the post-save "file that to your
 * daily log?" follow-up) as a prompt with two buttons. Designed to sit directly
 * below the Soren orb. Accepting a `file_daily_log` confirm calls
 * `config.fileToDailyLog`; "Skip" dismisses. Returns null when nothing pending.
 */
export function SorenConfirmRow({ className, style }: SorenConfirmRowProps): ReactElement | null {
  const { pendingAction, proposeAction, config, speak } = useSoren();
  const [busy, setBusy] = useState(false);

  if (pendingAction?.type !== 'confirm') return null;
  const payload = pendingAction.payload as SorenConfirmPayload;

  const dismiss = (): void => {
    setBusy(false);
    proposeAction(null);
  };

  const accept = async (): Promise<void> => {
    setBusy(true);
    try {
      if (payload.kind === 'file_daily_log') {
        await config.fileToDailyLog?.(payload.note ?? '', payload.photoUrls);
      }
      speak('Filed to your daily log.');
      proposeAction(null);
    } catch {
      speak("Sorry, I couldn't file that.");
      setBusy(false);
    }
  };

  const btn = (primary: boolean): CSSProperties => ({
    flex: 1,
    minHeight: sizes.tapMin,
    padding: '0.6rem 0.875rem',
    borderRadius: '0.5rem',
    border: primary ? 'none' : `1px solid ${tokens.muted}`,
    background: primary ? tokens.accent : 'transparent',
    color: primary ? tokens.onAccent : 'inherit',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    opacity: busy ? 0.6 : 1,
  });

  return (
    <div
      data-soren-confirm-row=""
      role="group"
      aria-label={payload.prompt}
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', ...style }}
    >
      <p style={{ margin: 0, textAlign: 'center', fontSize: '0.95rem', color: tokens.onSurface }}>
        {payload.prompt}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" disabled={busy} onClick={() => void accept()} style={btn(true)}>
          {busy ? 'Filing…' : (payload.confirmLabel ?? 'Yes, file it')}
        </button>
        <button type="button" disabled={busy} onClick={dismiss} style={btn(false)}>
          {payload.cancelLabel ?? 'Skip'}
        </button>
      </div>
    </div>
  );
}
