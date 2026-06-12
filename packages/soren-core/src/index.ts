/**
 * @varshylinc/soren-core
 *
 * Framework-agnostic contracts + pure logic for the Soren voice layer.
 * No React. Browser globals (used only by the speech utility) are guarded by
 * `typeof window`, so the package stays import-safe in Node/SSR.
 */
export type {
  VoiceState,
  SorenToolDefinition,
  SorenAdapterConfig,
  SorenAction,
  SorenConfirmPayload,
  SorenVoiceSettings,
  SorenTokenResponse,
  SorenApiEnvelope,
} from './types.js';
export { DEFAULT_VOICE_SETTINGS, SOREN_AUDIO_CAPTURE_DEFAULTS } from './types.js';

export type { VoiceEvent } from './stateMachine.js';
export { voiceReducer, INITIAL_VOICE_STATE } from './stateMachine.js';

export type { SorenPersona, PersonaPromptOverrides } from './persona.js';
export { buildPersonaPrompt, default as sorenPersona } from './persona.js';

export type { SorenSpeakOptions } from './speech.js';
export { sorenSpeak, interruptSoren, isSorenSpeaking } from './speech.js';
