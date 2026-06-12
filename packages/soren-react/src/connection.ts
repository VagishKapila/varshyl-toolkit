/**
 * Connection helpers for the live voice engine. No React, no LiveKit imports —
 * keeps the React hook lean and these pieces unit-testable.
 */
import type {
  SorenAdapterConfig,
  SorenApiEnvelope,
  SorenTokenResponse,
} from '@varshylinc/soren-core';

/**
 * Mint a LiveKit token from the engine.
 *
 * VERIFIED contract (2026-06-11): `POST {tokenEndpoint}` with `{ persona,
 * productId }` returns `{ data: { token, roomName, liveKitUrl }, error, message }`.
 * A fresh `roomName` is issued per call.
 */
export async function mintToken(config: SorenAdapterConfig): Promise<SorenTokenResponse> {
  const url = config.tokenEndpoint || `${config.apiBaseUrl}/token`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = config.getAuthToken();
  if (auth) headers['Authorization'] = `Bearer ${auth}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ persona: 'soren', productId: config.productId }),
  });
  if (!res.ok) throw new Error(`token mint failed: HTTP ${res.status}`);

  const json = (await res.json()) as SorenApiEnvelope<SorenTokenResponse>;
  if (json.error || !json.data) {
    throw new Error(json.error ?? 'token mint returned no data');
  }
  if (!json.data.token || !json.data.liveKitUrl) {
    throw new Error('token mint response missing token/liveKitUrl');
  }
  return json.data;
}

/** Exponential backoff (capped): attempt 0→500ms, 1→1000ms, 2→2000ms. */
export function backoffMs(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt);
}

/** Promise-based delay. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Max reconnect attempts on unexpected disconnect. */
export const MAX_RECONNECT_ATTEMPTS = 3;

/** Detect a "save a note" intent and extract the note text from a transcript. */
export function parseQuickNote(transcript: string): string | null {
  const m = transcript.match(/(?:add|make|take|save)?\s*(?:a\s+)?(?:quick\s+)?note[:,]?\s*(.+)/i);
  const text = m?.[1]?.trim();
  return text && text.length > 0 ? text : null;
}
