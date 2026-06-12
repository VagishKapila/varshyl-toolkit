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
  /** Base URL of the host's Soren API. No trailing slash. Used for tool endpoints. */
  apiBaseUrl: string;
  /**
   * Full URL of the LiveKit token mint endpoint, e.g.
   * `https://varshyl-voice-engine-production.up.railway.app/token`.
   * The client POSTs `{ persona, productId }` and reads back the enveloped
   * {@link SorenTokenResponse}.
   */
  tokenEndpoint: string;
  /** Returns the current host auth token, or null when unauthenticated. */
  getAuthToken: () => string | null;
  /** Product tools exposed to the agent. */
  tools: SorenToolDefinition[];
  /**
   * Persist a quick note (Q1 Quick Notes feature). Called by SorenQuickNote on
   * confirm. `photoUrls` are optional already-uploaded photo URLs.
   */
  saveQuickNote?: (text: string, photoUrls?: string[]) => Promise<void>;
  /**
   * File a saved note to the host's daily log. Called by SorenConfirmRow when
   * the user accepts the "file to your daily log?" follow-up. Wire this to the
   * host's existing daily-log creation endpoint.
   */
  fileToDailyLog?: (note: string, photoUrls?: string[]) => Promise<void>;
  /** Optional CSS custom-property overrides, e.g. `{ '--soren-accent': '...' }`. */
  theme?: Record<string, string>;
}

/**
 * A structured action surfaced by Soren to the UI.
 *
 * - `quick_note`   — propose saving a note; payload `{ text, photoUrls? }`
 * - `confirm`      — generic yes/no confirmation; payload is host-defined
 * - `disambiguate` — ask the user to choose among options; payload host-defined
 */
export interface SorenAction {
  type: 'quick_note' | 'confirm' | 'disambiguate';
  payload: unknown;
}

/**
 * Payload shape for a `confirm` {@link SorenAction}. `kind` routes the accept
 * handler (e.g. `file_daily_log` → {@link SorenAdapterConfig.fileToDailyLog}).
 */
export interface SorenConfirmPayload {
  kind: 'file_daily_log' | string;
  /** Prompt spoken aloud and shown in the confirmation row. */
  prompt: string;
  /** The note text carried through from the saved quick note. */
  note?: string;
  photoUrls?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
}

/** User-facing voice preferences, persisted by the host. */
export interface SorenVoiceSettings {
  enabled: boolean;
  voiceOnDefault: boolean;
  readAloud: boolean;
  voiceProfile: 'calm' | 'direct' | 'friendly';
}

/**
 * Inner `data` payload of the token mint endpoint response.
 *
 * VERIFIED against the live engine on 2026-06-11:
 * `POST {tokenEndpoint}` → `{ data: SorenTokenResponse, error, message }`.
 * Note: the engine mints a NEW `roomName` per request (no session resume).
 */
export interface SorenTokenResponse {
  /** Short-lived LiveKit access token (JWT). */
  token: string;
  /** LiveKit room the token grants access to (unique per mint). */
  roomName: string;
  /** LiveKit realtime server URL (wss://…). */
  liveKitUrl: string;
}

/** Standard `{ data, error, message }` envelope used by the voice engine API. */
export interface SorenApiEnvelope<T> {
  data: T | null;
  error: string | null;
  message: string;
}

/** Safe defaults for {@link SorenVoiceSettings}. */
export const DEFAULT_VOICE_SETTINGS: SorenVoiceSettings = {
  enabled: true,
  voiceOnDefault: false,
  readAloud: true,
  voiceProfile: 'calm',
};
