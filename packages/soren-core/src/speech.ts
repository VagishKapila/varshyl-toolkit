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

function hasSpeech(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(synth: SpeechSynthesis, voiceName?: string): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
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
  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = options?.pitch ?? DEFAULT_PITCH;
    utterance.rate = options?.rate ?? DEFAULT_RATE;
    const voice = pickVoice(synth, options?.voiceName);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.cancel();
    synth.speak(utterance);
  });
}
