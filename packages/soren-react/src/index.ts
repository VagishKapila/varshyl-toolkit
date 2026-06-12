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

export { SorenPhotoPicker } from './SorenPhotoPicker.js';
export type { SorenPhotoPickerProps } from './SorenPhotoPicker.js';

export { SorenCamera } from './SorenCamera.js';
export type { SorenCameraProps } from './SorenCamera.js';

export { sortByNewest } from './photoPicker.js';

export { SorenAvatar } from './SorenAvatar.js';
export type { SorenAvatarProps } from './SorenAvatar.js';

export { SorenOrb } from './SorenOrb.js';
export type { SorenOrbProps } from './SorenOrb.js';

export { SorenWaveBars } from './SorenWaveBars.js';
export type { SorenWaveBarsProps } from './SorenWaveBars.js';

export { useAudioLevels } from './useAudioLevels.js';

export { SorenConfirmRow } from './SorenConfirmRow.js';
export type { SorenConfirmRowProps } from './SorenConfirmRow.js';

export { SorenNotifOnboarding } from './SorenNotifOnboarding.js';
export type { SorenNotifOnboardingProps } from './SorenNotifOnboarding.js';

export { cssVar, tokens, stateColor, ensureStyles } from './styles.js';

// Re-export core contracts + the TTS entry point for convenience.
export {
  sorenSpeak,
  interruptSoren,
  isSorenSpeaking,
  scheduleDailyReminder,
  maybeMorningBriefing,
} from '@varshylinc/soren-core';
export type {
  VoiceState,
  SorenAdapterConfig,
  SorenAction,
  SorenConfirmPayload,
  SorenSpeakOptions,
  SorenToolDefinition,
  SorenVoiceSettings,
  SorenTokenResponse,
  SorenApiEnvelope,
} from '@varshylinc/soren-core';
