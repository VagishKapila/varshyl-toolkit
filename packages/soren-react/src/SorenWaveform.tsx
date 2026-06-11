import { useEffect, type CSSProperties, type ReactElement } from 'react';
import { useSoren } from './SorenProvider.js';
import { ensureStyles, stateColor } from './styles.js';

export interface SorenWaveformProps {
  /** Number of animated bars. Default 5. */
  bars?: number;
  /** Optional live audio levels (0–1) to scale individual bars. */
  levels?: number[];
  className?: string;
  style?: CSSProperties;
}

/**
 * Audio-level waveform shown during listening/speaking. Bars are animated via
 * the injected `soren-wave` keyframes and colored through `--soren-*` vars.
 */
export function SorenWaveform({
  bars = 5,
  levels,
  className,
  style,
}: SorenWaveformProps): ReactElement | null {
  const { state } = useSoren();

  useEffect(() => {
    ensureStyles();
  }, []);

  const visible = state === 'listening' || state === 'speaking';
  if (!visible) return null;

  const color = stateColor(state);
  const count = Math.max(1, bars);

  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '2rem',
    ...style,
  };

  return (
    <div
      data-soren-waveform=""
      data-state={state}
      role="img"
      aria-label={state === 'listening' ? 'Listening' : 'Speaking'}
      className={className}
      style={containerStyle}
    >
      {Array.from({ length: count }).map((_, i) => {
        const level = levels?.[i];
        const barStyle: CSSProperties = {
          width: '0.25rem',
          height: '100%',
          borderRadius: '9999px',
          background: color,
          transformOrigin: 'center',
          transform: level != null ? `scaleY(${Math.max(0.2, Math.min(1, level))})` : undefined,
          animation: level == null ? 'soren-wave 1s ease-in-out infinite' : undefined,
          animationDelay: `${i * 0.12}s`,
        };
        return <span key={i} style={barStyle} />;
      })}
    </div>
  );
}
