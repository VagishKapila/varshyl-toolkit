/**
 * Transport contracts shared by client and engine. Verified against the live
 * varshyl-voice engine `/token` response.
 */

/** Standard API envelope from product back-ends a server adapter may call. */
export type SorenApiEnvelope<T = unknown> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string };

/** Response from the engine's `POST /token`. */
export interface SorenTokenResponse {
  readonly token: string;
  /** LiveKit websocket URL. */
  readonly url: string;
  readonly roomName?: string;
  readonly identity?: string;
  /** Product whose skill set the engine should load for this session. */
  readonly productId?: string;
}

/**
 * Microphone capture constraints for noisy job sites. Noise cancellation is a
 * silent reliability upgrade — applied on the capture/engine side, no UI.
 */
export const SOREN_AUDIO_CAPTURE_DEFAULTS = {
  autoGainControl: true,
  echoCancellation: true,
  noiseSuppression: true,
} as const;

export type SorenAudioCaptureDefaults = typeof SOREN_AUDIO_CAPTURE_DEFAULTS;
