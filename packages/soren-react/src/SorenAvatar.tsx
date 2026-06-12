import { useEffect, type CSSProperties, type ReactElement } from 'react';
import type { VoiceState } from '@varshylinc/soren-core';
import { useSoren } from './SorenProvider.js';
import { ensureStyles, tokens } from './styles.js';

export interface SorenAvatarProps {
  /** Orb diameter. Default 96px. */
  size?: number;
  /** Name shown under the orb. Default "Soren". */
  name?: string;
  className?: string;
  style?: CSSProperties;
}

const STATUS: Record<VoiceState, string> = {
  idle: 'Tap the mic to talk',
  connecting: 'Connecting…',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Soren is speaking…',
  error: 'Something went wrong',
};

function statusColor(state: VoiceState): string {
  if (state === 'listening') return tokens.listening;
  if (state === 'error') return tokens.error;
  if (state === 'idle' || state === 'connecting') return tokens.muted;
  return tokens.onSurface;
}

function orbAnimation(state: VoiceState): string | undefined {
  if (state === 'listening') return 'soren-orb-pulse 2s ease-in-out infinite';
  if (state === 'speaking') return 'soren-orb-pulse 1s ease-in-out infinite';
  return undefined;
}

/**
 * Central Soren presence: a gradient orb with a white "S", the name, and a
 * state-driven status line. Animations (pulse / ring / spin) are layered on by
 * the keyframes injected via {@link ensureStyles} and the `data-state` hook.
 */
export function SorenAvatar({
  size = 96,
  name = 'Soren',
  className,
  style,
}: SorenAvatarProps): ReactElement {
  const { state } = useSoren();

  useEffect(() => {
    ensureStyles();
  }, []);

  const showRing = state === 'listening' || state === 'speaking';
  const showSpinner = state === 'processing' || state === 'connecting';

  const orbStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    width: size,
    height: size,
    borderRadius: '9999px',
    background: tokens.gradient,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.onAccent,
    fontWeight: 700,
    fontSize: size * 0.42,
    lineHeight: 1,
    userSelect: 'none',
    animation: orbAnimation(state),
  };

  const stage: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      data-soren-avatar=""
      data-state={state}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        ...style,
      }}
    >
      <span style={stage}>
        {showRing ? (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '9999px',
              background: tokens.gradient,
              animation: 'soren-ring 2s ease-out infinite',
            }}
          />
        ) : null}
        {showSpinner ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            style={{
              position: 'absolute',
              width: size + 16,
              height: size + 16,
              animation: 'soren-spin 0.9s linear infinite',
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={tokens.processing}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="70 220"
            />
          </svg>
        ) : null}
        <span data-soren-orb="" style={orbStyle} aria-hidden="true">
          S
        </span>
      </span>
      <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{name}</span>
      <span role="status" aria-live="polite" style={{ fontSize: '0.9rem', color: statusColor(state) }}>
        {STATUS[state] ?? STATUS.idle}
      </span>
    </div>
  );
}
