import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { sorenSpeak, type SorenConfirmPayload } from '@varshylinc/soren-core';
import { useSoren } from './SorenProvider.js';
import { parseQuickNote } from './connection.js';
import { pickFiles } from './photoPicker.js';
import { sizes, tokens } from './styles.js';

const FILE_PROMPT = 'Got it. Want me to file that to your daily log?';

export interface SorenQuickNoteProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Q1 Quick Notes, voice-first. Watches the last transcript for an "add a
 * note: …" intent, shows a Confirm/Cancel card (no photos required), and on
 * confirm calls `config.saveQuickNote`. Photos are optional via a camera icon
 * (`capture="environment"` opens the device camera on mobile).
 *
 * On save, Soren speaks the daily-log follow-up via `sorenSpeak` (the single
 * TTS entry point; speechSynthesis today, ElevenLabs when the engine is wired).
 */
export function SorenQuickNote({ className, style }: SorenQuickNoteProps): ReactElement | null {
  const { lastTranscript, pendingAction, proposeAction, config } = useSoren();
  const [noteText, setNoteText] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const handledRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  // Path 1: auto-detect a "note" intent from the spoken transcript.
  useEffect(() => {
    if (!lastTranscript || lastTranscript === handledRef.current) return;
    const parsed = parseQuickNote(lastTranscript);
    if (parsed) {
      handledRef.current = lastTranscript;
      setNoteText(parsed);
      setPhotos([]);
    }
  }, [lastTranscript]);

  // Path 2: an explicit quick_note action pushed via proposeAction().
  useEffect(() => {
    if (pendingAction?.type !== 'quick_note') return;
    const text = (pendingAction.payload as { text?: string } | null)?.text;
    if (text) {
      setNoteText(text);
      setPhotos([]);
    }
  }, [pendingAction]);

  if (noteText === null) return null;

  const reset = (): void => {
    setNoteText(null);
    setPhotos([]);
    setSaving(false);
    setPicking(false);
    submittingRef.current = false;
    if (pendingAction?.type === 'quick_note') proposeAction(null);
  };

  // Awaits the native picker before continuing, so the save action can never
  // fire before a photo selection has resolved.
  const addPhotos = async (): Promise<void> => {
    const input = fileRef.current;
    if (!input) return;
    setPicking(true);
    try {
      const files = await pickFiles(input);
      if (files.length) setPhotos((prev) => [...prev, ...files]);
    } finally {
      setPicking(false);
    }
  };

  const onConfirm = async (): Promise<void> => {
    if (submittingRef.current || picking) return; // double-submit / mid-pick guard
    submittingRef.current = true;
    setSaving(true);
    const urls = photos.length ? photos.map((f) => URL.createObjectURL(f)) : undefined;
    const saved = noteText;
    try {
      await config.saveQuickNote?.(saved, urls);
    } catch {
      void sorenSpeak("Sorry, I couldn't save that note");
      setSaving(false);
      submittingRef.current = false;
      return;
    }
    reset();
    // Follow-up: ask whether to file the saved note to the daily log.
    void sorenSpeak(FILE_PROMPT);
    const payload: SorenConfirmPayload = {
      kind: 'file_daily_log',
      prompt: FILE_PROMPT,
      note: saved,
      photoUrls: urls,
    };
    proposeAction({ type: 'confirm', payload });
  };

  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    background: tokens.surface,
    color: tokens.onSurface,
    maxWidth: '24rem',
    ...style,
  };
  const btn = (bg: string): CSSProperties => ({
    flex: 1,
    minHeight: sizes.tapMin,
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: bg,
    color: tokens.onAccent,
    cursor: 'pointer',
    fontSize: '0.9rem',
    opacity: saving ? 0.6 : 1,
  });

  return (
    <div data-soren-quicknote="" role="group" aria-label="Save quick note" className={className} style={cardStyle}>
      <p style={{ margin: 0, fontWeight: 600 }}>Save quick note: {noteText}?</p>

      <button
        type="button"
        data-soren-quicknote-camera=""
        disabled={saving}
        onClick={() => void addPhotos()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          minHeight: sizes.tapMin,
          padding: 0,
          background: 'transparent',
          border: 'none',
          fontSize: '0.85rem',
          color: tokens.muted,
          cursor: 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
        </svg>
        {picking
          ? 'Selecting…'
          : photos.length > 0
            ? `${photos.length} file(s) attached`
            : 'Add photo / video (optional)'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        hidden
      />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          disabled={saving || picking}
          onClick={() => void onConfirm()}
          style={btn(tokens.accent)}
        >
          {saving ? 'Saving…' : picking ? 'Selecting…' : 'Confirm'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={reset}
          style={{ ...btn('transparent'), color: 'inherit', border: `1px solid ${tokens.muted}` }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
