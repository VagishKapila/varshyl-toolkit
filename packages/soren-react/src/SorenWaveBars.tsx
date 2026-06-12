import { useMemo, type CSSProperties, type ReactElement } from 'react';
import type { VoiceState } from '@varshylinc/soren-core';
import { useAudioLevels } from './useAudioLevels.js';
import { stateColor } from './styles.js';

const BAR_COUNT = 5;

export interface SorenWaveBarsProps {
  state: VoiceState;
  /** Bar track height in px. Default 28. */
  height?: number;
}

/** Per-state animation for a bar at index `i` (listening is RAF-driven, so none). */
function barAnimation(state: VoiceState, i: number): string | undefined {
  if (state === 'listening') return undefined;
  if (state === 'speaking') return `soren-bar-speak ${0.4 + i * 0.1}s ease-in-out infinite`;
  if (state === 'processing' || state === 'connecting') return undefined; // frozen
  return `soren-bar-idle ${1.1 + i * 0.18}s ease-in-out infinite`; // idle
}

function barHeight(state: VoiceState): string {
  if (state === 'processing' || state === 'connecting') return '50%'; // frozen mid
  if (state === 'error') return '20%';
  return '20%';
}

/**
 * Five vertical bars at the orb base. During `listening` heights track live mic
 * amplitude (Web Audio AnalyserNode via {@link useAudioLevels}); other states
 * use CSS keyframes (gentle idle, faster speak, frozen thinking).
 */
export function SorenWaveBars({ state, height = 28 }: SorenWaveBarsProps): ReactElement {
  const refs = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => ({ current: null as HTMLSpanElement | null })),
    [],
  );
  const listening = state === 'listening';
  useAudioLevels(listening, refs as unknown as React.RefObject<HTMLElement>[]);

  const color = stateColor(state);
  const bar = (i: number): CSSProperties => ({
    display: 'block',
    width: 4,
    height: barHeight(state),
    borderRadius: 999,
    background: color,
    transition: 'background 0.3s ease',
    animation: barAnimation(state, i),
  });

  const setRef = (i: number) => (el: HTMLSpanElement | null): void => {
    refs[i].current = el;
  };

  return (
    <div
      data-soren-wavebars=""
      data-state={state}
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height }}
    >
      {refs.map((_, i) => (
        <span key={i} ref={setRef(i)} style={bar(i)} />
      ))}
    </div>
  );
}
