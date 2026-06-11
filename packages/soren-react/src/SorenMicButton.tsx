import { useEffect, type CSSProperties, type ReactElement } from 'react';
import { useSoren } from './SorenProvider.js';
import { ensureStyles, stateColor, tokens } from './styles.js';

export interface SorenMicButtonProps {
  /** Override default bottom-right floating position. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  style?: CSSProperties;
}

const POSITION: Record<NonNullable<SorenMicButtonProps['position']>, CSSProperties> = {
  'bottom-right': { bottom: '1.5rem', right: '1.5rem' },
  'bottom-left': { bottom: '1.5rem', left: '1.5rem' },
  'top-right': { top: '1.5rem', right: '1.5rem' },
  'top-left': { top: '1.5rem', left: '1.5rem' },
};

const LABEL: Record<string, string> = {
  idle: 'Start voice session',
  connecting: 'Connecting',
  listening: 'Listening — tap to stop',
  processing: 'Thinking',
  speaking: 'Speaking',
  error: 'Voice error — tap to retry',
};

/**
 * Floating microphone button. All visual states are driven by `VoiceState`
 * and all colors resolve through `--soren-*` CSS variables (no hardcoded hex).
 */
export function SorenMicButton({
  position = 'bottom-right',
  className,
  style,
}: SorenMicButtonProps): ReactElement {
  const { state, startListening, stopListening } = useSoren();

  useEffect(() => {
    ensureStyles();
  }, []);

  const active = state === 'listening';
  const animated = state === 'listening' || state === 'processing' || state === 'connecting';

  const buttonStyle: CSSProperties = {
    position: 'fixed',
    ...POSITION[position],
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.onAccent,
    background: stateColor(state),
    boxShadow: `0 0 0 ${active ? '0.5rem' : '0'} ${stateColor(state)}`,
    transition: 'background 150ms ease, box-shadow 200ms ease',
    animation: animated ? 'soren-pulse 1.4s ease-in-out infinite' : undefined,
    ...style,
  };

  const onClick = (): void => {
    if (state === 'listening') stopListening();
    else startListening();
  };

  return (
    <button
      type="button"
      data-soren-mic=""
      data-state={state}
      aria-label={LABEL[state] ?? 'Voice'}
      aria-pressed={active}
      className={className}
      style={buttonStyle}
      onClick={onClick}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
          fill="currentColor"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
