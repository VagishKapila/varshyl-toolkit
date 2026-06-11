import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Room, RoomEvent } from 'livekit-client';
import {
  DEFAULT_VOICE_SETTINGS,
  INITIAL_VOICE_STATE,
  voiceReducer,
  type SorenAdapterConfig,
  type SorenTokenResponse,
  type SorenVoiceSettings,
  type VoiceState,
} from '@varshylinc/soren-core';

export interface SorenContextValue {
  state: VoiceState;
  settings: SorenVoiceSettings;
  config: SorenAdapterConfig;
  startListening: () => void;
  stopListening: () => void;
  updateSettings: (patch: Partial<SorenVoiceSettings>) => void;
}

const SorenContext = createContext<SorenContextValue | null>(null);

export interface SorenProviderProps {
  config: SorenAdapterConfig;
  initialSettings?: Partial<SorenVoiceSettings>;
  /** Connect to LiveKit on mount. Default true. */
  autoConnect?: boolean;
  children: ReactNode;
}

/** Decode a LiveKit data payload and map an agent-state signal to a transition. */
function agentSignalToState(topic: string | undefined, payload: Uint8Array): VoiceState | null {
  if (topic !== 'agent-state') return null;
  const signal = new TextDecoder().decode(payload).trim();
  switch (signal) {
    case 'thinking':
      return 'processing';
    case 'speaking':
      return 'speaking';
    case 'listening':
      return 'listening';
    case 'idle':
    case 'done':
      return 'idle';
    default:
      return null;
  }
}

async function mintToken(config: SorenAdapterConfig): Promise<SorenTokenResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = config.getAuthToken();
  if (auth) headers['Authorization'] = `Bearer ${auth}`;
  const res = await fetch(`${config.apiBaseUrl}/token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: config.productId }),
  });
  if (!res.ok) throw new Error(`token mint failed: ${res.status}`);
  return (await res.json()) as SorenTokenResponse;
}

/**
 * Owns the LiveKit room connection lifecycle and exposes voice state + controls
 * via {@link useSoren}. The actual STT/LLM/TTS pipeline runs server-side in the
 * hosted voice engine; this provider only manages the client room + state.
 */
export function SorenProvider({
  config,
  initialSettings,
  autoConnect = true,
  children,
}: SorenProviderProps): ReactElement {
  const [state, dispatch] = useReducer(voiceReducer, INITIAL_VOICE_STATE);
  const [settings, setSettings] = useState<SorenVoiceSettings>({
    ...DEFAULT_VOICE_SETTINGS,
    ...initialSettings,
  });
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    if (!autoConnect) return;
    let cancelled = false;
    const room = new Room();
    roomRef.current = room;

    const onData = (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string): void => {
      const next = agentSignalToState(topic, payload);
      if (next === 'processing') dispatch({ type: 'PROCESSING' });
      else if (next === 'speaking') dispatch({ type: 'SPEAKING' });
      else if (next === 'listening') dispatch({ type: 'START_LISTENING' });
      else if (next === 'idle') dispatch({ type: 'DONE' });
    };
    const onDisconnected = (): void => dispatch({ type: 'RESET' });

    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.Disconnected, onDisconnected);

    dispatch({ type: 'CONNECT' });
    (async () => {
      try {
        const { serverUrl, token } = await mintToken(config);
        await room.connect(serverUrl, token);
        if (!cancelled) dispatch({ type: 'CONNECTED' });
      } catch (err) {
        if (!cancelled) dispatch({ type: 'ERROR', message: String(err) });
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.Disconnected, onDisconnected);
      void room.disconnect();
      roomRef.current = null;
    };
  }, [autoConnect, config]);

  const startListening = useCallback((): void => {
    void roomRef.current?.localParticipant?.setMicrophoneEnabled(true);
    dispatch({ type: 'START_LISTENING' });
  }, []);

  const stopListening = useCallback((): void => {
    void roomRef.current?.localParticipant?.setMicrophoneEnabled(false);
    dispatch({ type: 'DONE' });
  }, []);

  const updateSettings = useCallback((patch: Partial<SorenVoiceSettings>): void => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<SorenContextValue>(
    () => ({ state, settings, config, startListening, stopListening, updateSettings }),
    [state, settings, config, startListening, stopListening, updateSettings],
  );

  return <SorenContext.Provider value={value}>{children}</SorenContext.Provider>;
}

/** Access Soren voice state + controls. Throws if used outside a SorenProvider. */
export function useSoren(): SorenContextValue {
  const ctx = useContext(SorenContext);
  if (ctx === null) throw new Error('useSoren must be used within a <SorenProvider>');
  return ctx;
}
