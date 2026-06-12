/**
 * Soren's single text-to-speech entry point. Callers (in soren-react and hosts)
 * only ever call {@link sorenSpeak} — the underlying engine can change without
 * touching any callsite.
 *
 * Browser-targeted, but import-safe in Node/SSR: every Web Speech access is
 * guarded by `typeof window`, so importing this module never throws server-side.
 */

const PREFERRED_VOICE = 'Google UK English Female';
const DEFAULT_PITCH = 0.9;
const DEFAULT_RATE = 0.95;

export interface SorenSpeakOptions {
  pitch?: number;
  rate?: number;
  /** Override the preferred voice name. Falls back to the first available. */
  voiceName?: string;
}

let speaking = false;

function hasSpeech(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Whether Soren's client-side TTS is currently producing audio. */
export function isSorenSpeaking(): boolean {
  return speaking;
}

/**
 * Stop any in-progress Soren speech immediately (barge-in). Cancels the
 * speechSynthesis queue and clears the speaking flag. Audio elements owned by
 * the LiveKit agent track are paused by the caller (soren-react), since core
 * does not hold DOM references to them.
 *
 * TODO(elevenlabs): also pause/teardown the ElevenLabs <audio> element here once
 * the primary TTS path attaches one.
 */
export function interruptSoren(): void {
  if (hasSpeech()) window.speechSynthesis.cancel();
  speaking = false;
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

/**
 * Resolve the voice list. On Android Chrome `getVoices()` is empty on first
 * call and only populates after the `voiceschanged` event — so wait for it
 * (capped at 1s, since some devices never fire it) before selecting a voice.
 */
function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const existing = synth.getVoices();
  if (existing.length) return Promise.resolve(existing);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish);
    setTimeout(finish, 1000);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], voiceName?: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const wanted = voiceName ?? PREFERRED_VOICE;
  return voices.find((v) => v.name === wanted) ?? voices[0] ?? null;
}

/**
 * Speak `text` aloud. Resolves when playback finishes (or immediately if no
 * speech engine is available). Any in-progress speech is cancelled first so the
 * latest utterance always wins.
 *
 * TODO(elevenlabs): primary path — POST `text` to the varshyl-voice-engine TTS
 * endpoint and play the returned audio for the branded ElevenLabs voice. Pending
 * engine endpoint verification. The speechSynthesis path below is the fallback;
 * when ElevenLabs is wired, callers of `sorenSpeak` do not change.
 */
export async function sorenSpeak(text: string, options?: SorenSpeakOptions): Promise<void> {
  if (!text || !hasSpeech()) return;
  const synth = window.speechSynthesis;

  const voices = await loadVoices(synth);
  const voice = pickVoice(voices, options?.voiceName);
  console.info(`[soren] sorenSpeak voice: ${voice?.name ?? '(engine default)'} | "${text.slice(0, 48)}"`);

  // Android Chrome stalls if a new utterance is queued while one is speaking/
  // pending — cancel first, then give the engine a beat before re-speaking.
  if (synth.speaking || synth.pending) synth.cancel();
  if (isAndroid()) await new Promise((r) => setTimeout(r, 100));

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = options?.pitch ?? DEFAULT_PITCH;
    utterance.rate = options?.rate ?? DEFAULT_RATE;
    if (voice) utterance.voice = voice;
    const done = (): void => {
      speaking = false;
      resolve();
    };
    utterance.onend = done;
    utterance.onerror = done;
    speaking = true;
    synth.speak(utterance);
  });
}
