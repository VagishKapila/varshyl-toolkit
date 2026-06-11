/**
 * @varshylinc/soren-core — shared contracts
 *
 * Framework-agnostic types for the Soren voice layer. No React, no DOM.
 * These are the contracts a host product implements/passes; the runtime
 * implementation lives in the hosted `varshyl-voice-engine` service (see
 * docs/SOREN_RUNTIME_HANDOFF.md).
 */

/**
 * The lifecycle state of a Soren voice session as observed by the client.
 *
 * Superset of the runtime client states (`connecting | idle | listening |
 * speaking`) from `varshyl-voice` AriaHUD, plus explicit `processing`
 * (maps to the agent's `thinking` state) and `error`.
 */
export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

/**
 * Declarative description of a single tool the host exposes to Soren.
 *
 * `inputSchema` is a JSON Schema object describing the tool arguments. The
 * engine forwards validated arguments to `endpoint` using `method`, attaching
 * the host auth token under `authHeaderName`.
 */
export interface SorenToolDefinition {
  name: string;
  description: string;
  /** JSON Schema for the tool's input arguments. */
  inputSchema: Record<string, unknown>;
  /** Absolute or `apiBaseUrl`-relative URL the engine calls for this tool. */
  endpoint: string;
  method: 'GET' | 'POST';
  /** Header name the auth token is sent under, e.g. `Authorization`. */
  authHeaderName: string;
}

/**
 * Everything a host product supplies to wire Soren into its app.
 *
 * NOTE: This is the flat shape specified for the toolkit extraction. The
 * `SorenAdapterConfig` referenced as "§9.4" in upstream docs was never
 * located (see SOREN_RUNTIME_HANDOFF.md §12d — marked UNVERIFIED), so this
 * contract is authoritative for the toolkit going forward.
 *
 * There is intentionally no LiveKit `serverUrl` here: the client obtains the
 * realtime server URL + access token from the token endpoint response
 * (`SorenTokenResponse`) derived from `apiBaseUrl` + `getAuthToken()`.
 */
export interface SorenAdapterConfig {
  /** Stable product identifier, e.g. `constructinv`. Sent when minting tokens. */
  productId: string;
  /** Base URL of the host's Soren API / token mint endpoint. No trailing slash. */
  apiBaseUrl: string;
  /** Returns the current host auth token, or null when unauthenticated. */
  getAuthToken: () => string | null;
  /** Product tools exposed to the agent. */
  tools: SorenToolDefinition[];
  /** Optional CSS custom-property overrides, e.g. `{ '--soren-accent': '...' }`. */
  theme?: Record<string, string>;
}

/** User-facing voice preferences, persisted by the host. */
export interface SorenVoiceSettings {
  enabled: boolean;
  voiceOnDefault: boolean;
  readAloud: boolean;
  voiceProfile: 'calm' | 'direct' | 'friendly';
}

/**
 * Response contract for the token mint endpoint
 * (`POST {apiBaseUrl}/token`).
 *
 * UNVERIFIED: the exact wire shape was not in the handoff doc. The runtime
 * HUD mints a LiveKit JWT via `POST /api/token`; this is the minimal shape the
 * client needs to connect. Adjust when the engine contract is confirmed.
 */
export interface SorenTokenResponse {
  /** LiveKit realtime server URL (wss://…). */
  serverUrl: string;
  /** Short-lived LiveKit access token (JWT). */
  token: string;
}

/** Safe defaults for {@link SorenVoiceSettings}. */
export const DEFAULT_VOICE_SETTINGS: SorenVoiceSettings = {
  enabled: true,
  voiceOnDefault: false,
  readAloud: true,
  voiceProfile: 'calm',
};
