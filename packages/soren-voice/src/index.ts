export const SOREN_VOICE_ENGINE =
  'https://varshyl-voice-engine-production.up.railway.app';

export const VERSION = '0.1.0' as const;

export type SorenPersona = 'soren' | 'aria' | 'lucian';

export type SorenVoiceState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'error';

export interface SorenVoiceConfig {
  productId: string;
  persona?: SorenPersona;
  engineUrl?: string;
}

export interface SorenVoiceToken {
  token: string;
  roomName: string;
  liveKitUrl: string;
}

export async function getSorenToken(
  config: SorenVoiceConfig,
): Promise<SorenVoiceToken> {
  const url = config.engineUrl ?? SOREN_VOICE_ENGINE;
  const res = await fetch(`${url}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: config.productId,
      persona: config.persona ?? 'soren',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `Voice engine error: ${res.status}`,
    );
  }
  const data = await res.json();
  return data.data ?? data;
}
