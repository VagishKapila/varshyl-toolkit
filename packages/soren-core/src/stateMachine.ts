/**
 * Pure voice-session state machine. No side effects, no framework deps.
 *
 * Mirrors the runtime mapping in `varshyl-voice` (AriaHUD client state +
 * server agent state): the agent's `thinking` maps to `processing`, and the
 * client tracks `connecting → idle → listening → processing → speaking`.
 */
import type { VoiceState } from './types.js';

/**
 * Events that drive {@link voiceReducer}.
 *
 * - `CONNECT`            — begin connecting to the realtime session
 * - `CONNECTED`          — realtime session established (ready/idle)
 * - `START_LISTENING`    — mic is capturing the user's turn
 * - `TRANSCRIPT_RECEIVED`— an utterance was transcribed (hand off to brain)
 * - `PROCESSING`         — agent is thinking / running tools
 * - `SPEAKING`           — agent is producing speech
 * - `DONE`               — agent finished its turn (return to idle)
 * - `ERROR`              — unrecoverable error in the session
 * - `RESET`              — return to a clean idle state
 */
export type VoiceEvent =
  | { type: 'CONNECT' }
  | { type: 'CONNECTED' }
  | { type: 'START_LISTENING' }
  | { type: 'TRANSCRIPT_RECEIVED'; transcript?: string }
  | { type: 'PROCESSING' }
  | { type: 'SPEAKING' }
  | { type: 'DONE' }
  | { type: 'ERROR'; message?: string }
  | { type: 'RESET' };

/** Initial state for a fresh session. */
export const INITIAL_VOICE_STATE: VoiceState = 'idle';

/**
 * Deterministic reducer for {@link VoiceState}.
 *
 * Pure: given the same `(state, event)` it always returns the same result and
 * performs no I/O. Unknown/invalid transitions return the current state
 * unchanged (except `ERROR`/`RESET`, which always apply).
 */
export function voiceReducer(state: VoiceState, event: VoiceEvent): VoiceState {
  // ERROR and RESET are global — valid from any state.
  if (event.type === 'ERROR') return 'error';
  if (event.type === 'RESET') return 'idle';

  switch (event.type) {
    case 'CONNECT':
      return state === 'idle' ? 'connecting' : state;

    case 'CONNECTED':
      return state === 'connecting' ? 'idle' : state;

    case 'START_LISTENING':
      // Allowed once connected (idle) or to resume after a turn.
      return state === 'idle' || state === 'speaking' ? 'listening' : state;

    case 'TRANSCRIPT_RECEIVED':
      return state === 'listening' ? 'processing' : state;

    case 'PROCESSING':
      // Agent began thinking — valid while listening or already processing.
      return state === 'listening' || state === 'processing' ? 'processing' : state;

    case 'SPEAKING':
      return state === 'processing' || state === 'listening' ? 'speaking' : state;

    case 'DONE':
      return state === 'speaking' || state === 'processing' ? 'idle' : state;

    default:
      return state;
  }
}
