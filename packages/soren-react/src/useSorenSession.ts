import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Room } from 'livekit-client';
import {
  DEFAULT_VOICE_SETTINGS,
  INITIAL_VOICE_STATE,
  SOREN_AUDIO_CAPTURE_DEFAULTS,
  interruptSoren,
  voiceReducer,
  type SorenAction,
  type SorenAdapterConfig,
  type SorenVoiceSettings,
  type VoiceState,
} from '@varshylinc/soren-core';
import { MAX_RECONNECT_ATTEMPTS, backoffMs, delay, mintToken } from './connection.js';
import { resumeAudio, wireRoom } from './roomLifecycle.js';

/** Transport-level connection status, distinct from the {@link VoiceState}. */
export type SorenConnection = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export interface SorenSession {
  state: VoiceState;
  connection: SorenConnection;
  lastTranscript: string | null;
  lastResponse: string | null;
  pendingAction: SorenAction | null;
  settings: SorenVoiceSettings;
  startListening: () => void;
  stopListening: () => void;
  proposeAction: (action: SorenAction | null) => void;
  updateSettings: (patch: Partial<SorenVoiceSettings>) => void;
  /** True while Soren is producing voice output (agent track speaking). */
  isSorenSpeaking: boolean;
}

function mapAgentState(signal: string | undefined): VoiceState | null {
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

/**
 * Owns the LiveKit room: token mint → connect → agent audio playback → state +
 * transcript mapping → reconnect on disconnect (3 retries, exponential backoff).
 * The engine mints a fresh room per token, so a reconnect starts a new session.
 */
export function useSorenSession(
  config: SorenAdapterConfig,
  initialSettings?: Partial<SorenVoiceSettings>,
  autoConnect = true,
): SorenSession {
  const [state, dispatch] = useReducer(voiceReducer, INITIAL_VOICE_STATE);
  const [connection, setConnection] = useState<SorenConnection>('idle');
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<SorenAction | null>(null);
  const [settings, setSettings] = useState<SorenVoiceSettings>({
    ...DEFAULT_VOICE_SETTINGS,
    ...initialSettings,
  });
  const roomRef = useRef<Room | null>(null);

  const applyAgentState = useCallback((signal: string | undefined): void => {
    const next = mapAgentState(signal);
    if (next === 'processing') dispatch({ type: 'PROCESSING' });
    else if (next === 'speaking') dispatch({ type: 'SPEAKING' });
    else if (next === 'listening') dispatch({ type: 'START_LISTENING' });
    else if (next === 'idle') dispatch({ type: 'DONE' });
  }, []);

  useEffect(() => {
    if (!autoConnect) return;
    let closing = false;
    let attempts = 0;
    const audioEls: HTMLAudioElement[] = [];
    // FEAT 1: noise suppression / echo cancellation / AGC on the mic track.
    const room = new Room({ audioCaptureDefaults: { ...SOREN_AUDIO_CAPTURE_DEFAULTS } });
    roomRef.current = room;

    const reconnect = async (): Promise<void> => {
      if (closing) return;
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        setConnection('failed');
        dispatch({ type: 'ERROR', message: 'reconnect failed' });
        return;
      }
      const attempt = attempts++;
      setConnection('reconnecting');
      await delay(backoffMs(attempt));
      if (closing) return;
      try {
        const creds = await mintToken(config);
        await room.connect(creds.liveKitUrl, creds.token);
        attempts = 0;
        setConnection('connected');
      } catch {
        void reconnect();
      }
    };

    wireRoom(room, audioEls, {
      onAgentState: applyAgentState,
      onUserTranscript: (text) => {
        setLastTranscript(text);
        dispatch({ type: 'TRANSCRIPT_RECEIVED', transcript: text });
      },
      onAgentResponse: setLastResponse,
      onDisconnect: () => {
        if (!closing) void reconnect();
      },
      // FEAT 2: user spoke over Soren — cancel TTS, pause agent audio, listen.
      onBargeIn: () => {
        interruptSoren();
        audioEls.forEach((el) => el.pause());
        dispatch({ type: 'START_LISTENING' });
      },
    });

    setConnection('connecting');
    dispatch({ type: 'CONNECT' });
    void (async () => {
      try {
        const creds = await mintToken(config);
        await room.connect(creds.liveKitUrl, creds.token);
        if (closing) return;
        attempts = 0;
        setConnection('connected');
        dispatch({ type: 'CONNECTED' });
      } catch (err) {
        if (closing) return;
        setConnection('failed');
        dispatch({ type: 'ERROR', message: String(err) });
      }
    })();

    return () => {
      closing = true;
      room.removeAllListeners();
      audioEls.forEach((el) => el.remove());
      void room.disconnect();
      roomRef.current = null;
    };
  }, [autoConnect, config, applyAgentState]);

  const startListening = useCallback((): void => {
    const room = roomRef.current;
    if (room) void resumeAudio(room); // unlock iOS audio on this user gesture
    void room?.localParticipant?.setMicrophoneEnabled(true);
    dispatch({ type: 'START_LISTENING' });
  }, []);
  const stopListening = useCallback((): void => {
    void roomRef.current?.localParticipant?.setMicrophoneEnabled(false);
    dispatch({ type: 'DONE' });
  }, []);
  const updateSettings = useCallback(
    (patch: Partial<SorenVoiceSettings>): void => setSettings((p) => ({ ...p, ...patch })),
    [],
  );
  const proposeAction = useCallback((a: SorenAction | null): void => setPendingAction(a), []);

  const isSorenSpeaking = state === 'speaking';

  return useMemo(
    () => ({
      state, connection, lastTranscript, lastResponse, pendingAction, settings,
      startListening, stopListening, proposeAction, updateSettings, isSorenSpeaking,
    }),
    [state, connection, lastTranscript, lastResponse, pendingAction, settings,
      startListening, stopListening, proposeAction, updateSettings, isSorenSpeaking],
  );
}
