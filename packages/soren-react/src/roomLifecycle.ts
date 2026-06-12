/**
 * LiveKit room wiring kept out of the React hook so {@link useSorenSession}
 * stays lean. These helpers translate raw LiveKit events into the small set of
 * callbacks the session cares about.
 */
import {
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
  type Room,
  type TranscriptionSegment,
} from 'livekit-client';

export interface RoomHandlers {
  onAgentState: (signal: string | undefined) => void;
  onUserTranscript: (text: string) => void;
  onAgentResponse: (text: string) => void;
  onDisconnect: () => void;
  /** Fires once when the local participant starts speaking (VAD onset). */
  onBargeIn: () => void;
}

/**
 * Resume audio playback after a user gesture. iOS Safari (and Chrome Android)
 * block autoplay until the user interacts; the mic-button tap is that gesture.
 * `room.startAudio()` resumes the shared AudioContext so the agent's
 * ElevenLabs track becomes audible. Safe to call repeatedly.
 */
export async function resumeAudio(room: Room): Promise<void> {
  try {
    await room.startAudio();
  } catch {
    /* no-op: not yet connected, or already started */
  }
}

/** Attach a subscribed audio track to a hidden, autoplaying element. */
export function attachAudio(track: RemoteTrack, sink: HTMLAudioElement[]): void {
  if (track.kind !== Track.Kind.Audio) return;
  const el = track.attach() as HTMLAudioElement;
  el.autoplay = true;
  el.style.display = 'none';
  document.body.appendChild(el);
  void el.play?.().catch(() => undefined);
  sink.push(el);
}

/**
 * Subscribe the room's events to the given handlers. Agent state arrives via
 * the `lk.agent.state` participant attribute (LiveKit Agents convention) with
 * an `agent-state` data-topic fallback; transcripts via TranscriptionReceived.
 */
export function wireRoom(room: Room, audioEls: HTMLAudioElement[], h: RoomHandlers): void {
  let localSpeaking = false; // tracks VAD onset (edge, not level)
  room
    .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      const now = speakers.some((s) => s.isLocal);
      if (now && !localSpeaking) h.onBargeIn();
      localSpeaking = now;
    })
    .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => attachAudio(track, audioEls))
    .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) =>
      track.detach().forEach((el) => el.remove()),
    )
    .on(RoomEvent.ParticipantAttributesChanged, (_changed: Record<string, string>, p: Participant) => {
      if (p.isLocal) return;
      const signal = p.attributes?.['lk.agent.state'];
      console.info(`[soren] agent state (attr): ${signal ?? '(none)'}`);
      h.onAgentState(signal);
    })
    .on(RoomEvent.DataReceived, (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
      if (topic === 'agent-state') {
        const signal = new TextDecoder().decode(payload).trim();
        console.info(`[soren] agent state (data): ${signal}`);
        h.onAgentState(signal);
      }
    })
    .on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], p?: Participant) => {
      // Some engines/agents never flag `final` on the Groq path. Prefer final
      // segments, but fall back to interim text so the transcript (and the
      // quick-note card it drives) is never silently dropped on Android.
      const finals = segments.filter((s) => s.final);
      const chosen = finals.length ? finals : segments;
      const text = chosen.map((s) => s.text).join(' ').trim();
      const fromAgent = Boolean(p && !p.isLocal);
      console.info(
        `[soren] transcription: segments=${segments.length} finals=${finals.length} ` +
          `local=${p?.isLocal ?? 'n/a'} identity=${p?.identity ?? 'n/a'} ` +
          `${fromAgent ? 'agent' : 'user'} text="${text}"`,
      );
      if (!text) return;
      if (fromAgent) h.onAgentResponse(text);
      else h.onUserTranscript(text);
    })
    .on(RoomEvent.Disconnected, h.onDisconnect);
}
