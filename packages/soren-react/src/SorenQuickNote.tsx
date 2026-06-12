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
import { SorenPhotoPicker } from './SorenPhotoPicker.js';
import { sizes, tokens } from './styles.js';

const FILE_PROMPT = 'Got it. Want me to file that to your daily log?';

export interface SorenQuickNoteProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Q1 Quick Notes, voice-first. Watches the last transcript for an "add a
 * note: …" intent, shows a Confirm/Cancel card (no photos required), and on
 * confirm calls `config.saveQuickNote`. Photos are optional via
 * {@link SorenPhotoPicker} (live camera + gallery).
 *
 * On save, Soren speaks the daily-log follow-up via `sorenSpeak` (the single
 * TTS entry point; speechSynthesis today, ElevenLabs when the engine is wired).
 */
export function SorenQuickNote({ className, style }: SorenQuickNoteProps): ReactElement | null {
  const { lastTranscript, pendingAction, proposeAction, config } = useSoren();
  const [noteText, setNoteText] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const handledRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

  // Path 1: auto-detect a "note" intent from the spoken transcript.
  useEffect(() => {
    if (!lastTranscript || lastTranscript === handledRef.current) return;
    const parsed = parseQuickNote(lastTranscript);
    console.info(`[soren] quick-note parse: transcript="${lastTranscript}" → ${parsed ? `note="${parsed}"` : 'no match'}`);
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
    setPhotoBusy(false);
    submittingRef.current = false;
    if (pendingAction?.type === 'quick_note') proposeAction(null);
  };

  const onConfirm = async (): Promise<void> => {
    if (submittingRef.current || photoBusy) return; // double-submit / mid-pick guard
    submittingRef.current = true;
    setSaving(true);
    const urls = photos.length ? photos.map((f) => URL.createObjectURL(f)) : undefined;
    const saved = noteText;
    console.info(`[soren] saveQuickNote start: "${saved}" photos=${urls?.length ?? 0}`);
    try {
      await config.saveQuickNote?.(saved, urls);
      console.info('[soren] saveQuickNote success');
    } catch (err) {
      console.error('[soren] saveQuickNote failed:', err);
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

      <SorenPhotoPicker files={photos} onChange={setPhotos} onBusyChange={setPhotoBusy} disabled={saving} />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          disabled={saving || photoBusy}
          onClick={() => void onConfirm()}
          style={btn(tokens.accent)}
        >
          {saving ? 'Saving…' : photoBusy ? 'Selecting…' : 'Confirm'}
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
