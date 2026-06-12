/**
 * Theming helpers. ALL component colors flow through CSS custom properties so
 * hosts can override via `SorenAdapterConfig.theme` or global `--soren-*` vars.
 *
 * Hard rule: no hardcoded hex anywhere. Fallbacks use `hsl()` literals, which
 * remain fully overridable by setting the corresponding `--soren-*` variable.
 */
import type { VoiceState } from '@varshylinc/soren-core';

/** Build a `var(--soren-<name>, <fallback>)` expression. */
export function cssVar(name: string, fallback: string): string {
  return `var(--soren-${name}, ${fallback})`;
}

/** Centralized design tokens — every value is a CSS variable with an hsl fallback. */
export const tokens = {
  accent: cssVar('accent', 'hsl(243 75% 59%)'),
  onAccent: cssVar('on-accent', 'hsl(0 0% 100%)'),
  surface: cssVar('surface', 'hsl(240 6% 12%)'),
  onSurface: cssVar('on-surface', 'hsl(0 0% 98%)'),
  muted: cssVar('muted', 'hsl(240 4% 46%)'),
  listening: cssVar('listening', 'hsl(152 60% 45%)'),
  processing: cssVar('processing', 'hsl(43 96% 56%)'),
  speaking: cssVar('speaking', 'hsl(206 90% 55%)'),
  error: cssVar('error', 'hsl(0 72% 55%)'),
  /** Soren brand gradient (orb/avatar). Stops resolve from --soren-1/2/3. */
  gradient: `linear-gradient(135deg, ${cssVar('1', 'hsl(243 75% 59%)')}, ${cssVar(
    '2',
    'hsl(280 89% 63%)',
  )}, ${cssVar('3', 'hsl(330 81% 60%)')})`,
} as const;

/**
 * Sizing tokens for mobile touch targets. Every value is a CSS variable with a
 * fallback, so hosts can tune tap sizes without editing components.
 * - `micTarget`: floating mic button (>= 64x64 per mobile guidelines)
 * - `micBottom`: mic offset from the bottom, added to the iOS safe-area inset
 * - `tapMin`: minimum height for card/action/camera buttons (>= 48px)
 */
export const sizes = {
  micTarget: cssVar('mic-size', '64px'),
  micBottom: cssVar('mic-bottom', '24px'),
  micInset: cssVar('mic-inset', '24px'),
  tapMin: cssVar('tap-min', '48px'),
} as const;

/** Pick the accent color for a given voice state. */
export function stateColor(state: VoiceState): string {
  switch (state) {
    case 'listening':
      return tokens.listening;
    case 'processing':
      return tokens.processing;
    case 'speaking':
      return tokens.speaking;
    case 'error':
      return tokens.error;
    case 'connecting':
      return tokens.muted;
    case 'idle':
    default:
      return tokens.accent;
  }
}

const STYLE_ID = 'soren-react-keyframes';

const KEYFRAMES = `
@keyframes soren-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.85; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes soren-wave {
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
}
@keyframes soren-orb-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes soren-ring {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes soren-spin {
  to { transform: rotate(360deg); }
}
`;

/** Inject animation keyframes once (no-op in non-DOM / SSR environments). */
export function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
}
