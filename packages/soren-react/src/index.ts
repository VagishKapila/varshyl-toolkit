/**
 * @varshylinc/soren-react
 *
 * React components + hooks for the Soren voice layer. Peer deps: react >=18,
 * livekit-client. Contracts/state machine come from @varshylinc/soren-core.
 */
export { SorenProvider, useSoren } from './SorenProvider.js';
export type { SorenProviderProps, SorenContextValue } from './SorenProvider.js';

export { useSorenSession } from './useSorenSession.js';
export type { SorenSession, SorenConnection } from './useSorenSession.js';

export { mintToken, parseQuickNote, backoffMs } from './connection.js';

export { SorenMicButton } from './SorenMicButton.js';
export type { SorenMicButtonProps } from './SorenMicButton.js';

export { SorenWaveform } from './SorenWaveform.js';
export type { SorenWaveformProps } from './SorenWaveform.js';

export { SorenActionCard } from './SorenActionCard.js';
export type { SorenActionCardProps, SorenActionOption } from './SorenActionCard.js';

export { SorenSettingsToggle } from './SorenSettingsToggle.js';
export type { SorenSettingsToggleProps } from './SorenSettingsToggle.js';

export { SorenQuickNote } from './SorenQuickNote.js';
export type { SorenQuickNoteProps } from './SorenQuickNote.js';

export { SorenAvatar } from './SorenAvatar.js';
export type { SorenAvatarProps } from './SorenAvatar.js';

export { cssVar, tokens, stateColor, ensureStyles } from './styles.js';

// Re-export core contracts for convenience.
export type {
  VoiceState,
  SorenAdapterConfig,
  SorenAction,
  SorenToolDefinition,
  SorenVoiceSettings,
  SorenTokenResponse,
  SorenApiEnvelope,
} from '@varshylinc/soren-core';
