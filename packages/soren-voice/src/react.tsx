'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  type RemoteTrack,
} from 'livekit-client';
import {
  getSorenToken,
  type SorenVoiceConfig,
  type SorenVoiceState,
} from './index';

interface SorenVoiceCtx {
  state: SorenVoiceState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isMuted: boolean;
  toggleMute: () => Promise<void>;
  error: string;
  isConnected: boolean;
}

const Ctx = createContext<SorenVoiceCtx | null>(null);

export interface SorenVoiceProviderProps {
  config: SorenVoiceConfig;
  children: ReactNode;
  onStateChange?: (state: SorenVoiceState) => void;
}

export function SorenVoiceProvider({
  config,
  children,
  onStateChange,
}: SorenVoiceProviderProps) {
  const [state, setState] = useState<SorenVoiceState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const roomRef = useRef<Room | null>(null);

  const updateState = useCallback(
    (s: SorenVoiceState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange],
  );

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    updateState('disconnected');
    setError('');
  }, [updateState]);

  const connect = useCallback(async () => {
    if (roomRef.current) disconnect();
    updateState('connecting');
    setError('');

    try {
      const { token, liveKitUrl } = await getSorenToken(config);

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind !== Track.Kind.Audio) return;
        updateState('speaking');
        const audio = new Audio();
        audio.srcObject = new MediaStream([track.mediaStreamTrack]);
        audio.play().catch(console.error);
      });

      room.on(RoomEvent.TrackUnsubscribed, () => {
        if (roomRef.current) updateState('listening');
      });

      room.on(RoomEvent.ConnectionStateChanged, (s: ConnectionState) => {
        if (s === ConnectionState.Connected) updateState('listening');
        if (s === ConnectionState.Disconnected) updateState('disconnected');
        if (s === ConnectionState.Reconnecting) updateState('connecting');
      });

      room.on(RoomEvent.Disconnected, () => {
        roomRef.current = null;
        updateState('disconnected');
      });

      await room.connect(liveKitUrl, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      updateState('listening');
    } catch (err: unknown) {
      console.error('[SorenVoice]', err);
      const msg = err instanceof Error ? err.message : 'Connection failed. Try again.';
      setError(msg);
      updateState('error');
      roomRef.current = null;
    }
  }, [config, disconnect, updateState]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
  }, [isMuted]);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  return (
    <Ctx.Provider
      value={{
        state,
        connect,
        disconnect,
        isMuted,
        toggleMute,
        error,
        isConnected: state !== 'disconnected' && state !== 'error',
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSorenVoice(): SorenVoiceCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSorenVoice must be used inside SorenVoiceProvider');
  }
  return ctx;
}

export interface SorenVoiceButtonProps {
  style?: React.CSSProperties;
  className?: string;
  labels?: Partial<Record<SorenVoiceState, string>> & {
    idle?: string;
  };
}

export function SorenVoiceButton({
  style,
  className,
  labels = {},
}: SorenVoiceButtonProps) {
  const { state, connect, disconnect } = useSorenVoice();

  const isIdle = state === 'disconnected' || state === 'error';

  const label = isIdle
    ? (labels.idle ?? '▶ Talk to Soren')
    : state === 'connecting'
      ? '⟳ Connecting...'
      : state === 'listening'
        ? '🎙 Listening — speak naturally'
        : state === 'speaking'
          ? '● Soren is speaking'
          : '⚠ Retry';

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={isIdle ? connect : disconnect}
      disabled={state === 'connecting'}
    >
      {label}
    </button>
  );
}
