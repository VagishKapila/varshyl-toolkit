import { useEffect, type CSSProperties, type ReactElement } from 'react';
import type { VoiceState } from '@varshylinc/soren-core';
import { useSoren } from './SorenProvider.js';
import { SorenWaveBars } from './SorenWaveBars.js';
import { cssVar, ensureStyles, stateColor, tokens } from './styles.js';

export interface SorenOrbProps {
  /** Orb diameter in px. Default 120. */
  size?: number;
  /** Paint a fixed full-screen dark bloom behind the orb. Default true. */
  fullBleed?: boolean;
  className?: string;
  style?: CSSProperties;
}

const STATUS: Record<VoiceState, string> = {
  idle: 'Tap to start',
  connecting: 'Connecting…',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Speaking…',
  error: 'Something went wrong',
};

const CONIC = `conic-gradient(from 0deg, ${cssVar('1', 'hsl(243 75% 59%)')}, ${cssVar(
  '2',
  'hsl(280 89% 63%)',
)}, ${cssVar('3', 'hsl(330 81% 60%)')}, ${cssVar('1', 'hsl(243 75% 59%)')})`;

function glowOpacity(state: VoiceState): number {
  if (state === 'speaking') return 0.9;
  if (state === 'listening') return 0.75;
  if (state === 'processing' || state === 'connecting') return 0.5;
  return 0.32; // idle / error
}

function breatheSpeed(state: VoiceState): string {
  if (state === 'speaking') return '1.6s';
  if (state === 'listening') return '2.2s';
  return '3s';
}

/**
 * Jarvis-style animated presence: a conic-gradient orb that breathes, a glowing
 * bloom that brightens with activity, a spinning arc while thinking, an error
 * flash, and a five-bar waveform at the base. CSS animations + Web Audio only.
 */
export function SorenOrb({ size = 120, fullBleed = true, className, style }: SorenOrbProps): ReactElement {
  const { state } = useSoren();
  useEffect(() => ensureStyles(), []);

  const spinning = state === 'processing' || state === 'connecting';
  const accent = stateColor(state);

  return (
    <div
      data-soren-orb-ui=""
      data-state={state}
      className={className}
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        ...style,
      }}
    >
      {fullBleed ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 38%, ${accent}22, transparent 55%), ${cssVar(
              'orb-bg',
              'hsl(154 13% 20%)',
            )}`,
            transition: 'background 0.5s ease',
          }}
        />
      ) : null}

      <div style={{ position: 'relative', width: size, height: size, zIndex: 1 }}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-30%',
            borderRadius: '9999px',
            background: accent,
            filter: 'blur(28px)',
            opacity: glowOpacity(state),
            animation: state === 'idle' ? undefined : 'soren-glow 2.4s ease-in-out infinite',
            transition: 'opacity 0.4s ease, background 0.4s ease',
          }}
        />
        <span
          data-soren-orb=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            overflow: 'hidden',
            animation: `soren-breathe ${breatheSpeed(state)} ease-in-out infinite`,
            boxShadow: `0 0 0 1px ${accent}33`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: '-25%',
              background: CONIC,
              animation: spinning ? 'soren-spin 1.4s linear infinite' : undefined,
            }}
          />
          {state === 'error' ? (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: tokens.error,
                animation: 'soren-flash 0.6s ease-out forwards',
              }}
            />
          ) : null}
        </span>
      </div>

      <SorenWaveBars state={state} />

      <span
        role="status"
        aria-live="polite"
        style={{
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: 13,
          letterSpacing: '0.04em',
          color: tokens.listening,
        }}
      >
        {STATUS[state] ?? STATUS.idle}
      </span>
    </div>
  );
}
