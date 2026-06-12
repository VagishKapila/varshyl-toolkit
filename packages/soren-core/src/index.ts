/**
 * @varshylinc/soren-core
 *
 * Framework-agnostic contracts + pure logic for the Soren voice layer.
 * No React, no DOM. Consumed by the soren-react package and by hosts.
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
export { DEFAULT_VOICE_SETTINGS } from './types.js';

export type { VoiceEvent } from './stateMachine.js';
export { voiceReducer, INITIAL_VOICE_STATE } from './stateMachine.js';

export type { SorenPersona, PersonaPromptOverrides } from './persona.js';
export { buildPersonaPrompt, default as sorenPersona } from './persona.js';
