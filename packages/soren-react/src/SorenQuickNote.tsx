import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { useSoren } from './SorenProvider.js';
import { parseQuickNote } from './connection.js';
import { tokens } from './styles.js';

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
 * On save, Soren speaks "Got it, note saved" using the browser speech engine —
 * the hosted engine has no verified client-invokable TTS-for-arbitrary-text API.
 */
export function SorenQuickNote({ className, style }: SorenQuickNoteProps): ReactElement | null {
  const { lastTranscript, pendingAction, proposeAction, config, speak } = useSoren();
  const [noteText, setNoteText] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const handledRef = useRef<string | null>(null);

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
    if (pendingAction?.type === 'quick_note') proposeAction(null);
  };

  const onConfirm = async (): Promise<void> => {
    setSaving(true);
    try {
      const photoUrls = photos.map((f) => URL.createObjectURL(f));
      await config.saveQuickNote?.(noteText, photoUrls.length ? photoUrls : undefined);
      speak('Got it, note saved');
      reset();
    } catch {
      speak("Sorry, I couldn't save that note");
      setSaving(false);
    }
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

      <label
        data-soren-quicknote-camera=""
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: tokens.muted, cursor: 'pointer' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
        </svg>
        {photos.length > 0 ? `${photos.length} photo(s) attached` : 'Add photo (optional)'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
        />
      </label>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" disabled={saving} onClick={() => void onConfirm()} style={btn(tokens.accent)}>
          {saving ? 'Saving…' : 'Confirm'}
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
