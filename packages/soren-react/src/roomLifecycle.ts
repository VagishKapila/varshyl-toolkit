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
  room
    .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => attachAudio(track, audioEls))
    .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) =>
      track.detach().forEach((el) => el.remove()),
    )
    .on(RoomEvent.ParticipantAttributesChanged, (_changed: Record<string, string>, p: Participant) => {
      if (!p.isLocal) h.onAgentState(p.attributes?.['lk.agent.state']);
    })
    .on(RoomEvent.DataReceived, (payload: Uint8Array, _p?: unknown, _k?: unknown, topic?: string) => {
      if (topic === 'agent-state') h.onAgentState(new TextDecoder().decode(payload).trim());
    })
    .on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], p?: Participant) => {
      const text = segments.filter((s) => s.final).map((s) => s.text).join(' ').trim();
      if (!text) return;
      if (p && !p.isLocal) h.onAgentResponse(text);
      else h.onUserTranscript(text);
    })
    .on(RoomEvent.Disconnected, h.onDisconnect);
}
