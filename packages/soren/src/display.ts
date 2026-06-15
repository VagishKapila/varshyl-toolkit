/**
 * Display state — DEMOTED from a source of truth to a thin mapper over the
 * engine's agent state. The engine (LiveKit Agents) owns the real lifecycle;
 * the client only mirrors it for the orb + status text.
 */

/** Visual states the orb / status text render. */
export type SorenDisplayState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

/** Agent states emitted by `@livekit/components-react` `useVoiceAssistant`. */
export type LiveKitAgentState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | (string & Record<never, never>);

export function mapAgentState(state: LiveKitAgentState | undefined): SorenDisplayState {
  switch (state) {
    case 'connecting':
    case 'initializing':
      return 'connecting';
    case 'listening':
      return 'listening';
    case 'thinking':
      return 'thinking';
    case 'speaking':
      return 'speaking';
    case 'disconnected':
    case undefined:
      return 'idle';
    default:
      return 'idle';
  }
}

export function statusText(state: SorenDisplayState): string {
  switch (state) {
    case 'connecting':
      return 'Connecting…';
    case 'listening':
      return 'Listening…';
    case 'thinking':
      return 'Thinking…';
    case 'speaking':
      return 'Soren is speaking…';
    case 'error':
      return 'Something went wrong';
    default:
      return 'Tap to start';
  }
}
