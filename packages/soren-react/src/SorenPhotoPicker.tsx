import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { pickFiles, sortByNewest } from './photoPicker.js';
import { SorenCamera } from './SorenCamera.js';
import { sizes, tokens } from './styles.js';

export interface SorenPhotoPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Reports when a pick/capture is in flight, so callers can block submit. */
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}

/**
 * Photo attachment UI for SorenQuickNote. Two paths, Web APIs only:
 * - "Take photo now" → live {@link SorenCamera} (getUserMedia, rear lens), with
 *   automatic fallback to a native `capture` input on iOS/WebView.
 * - "Add from gallery" → multi-select file picker.
 * Selected files are merged newest-first ({@link sortByNewest}).
 */
export function SorenPhotoPicker({
  files,
  onChange,
  onBusyChange,
  disabled,
}: SorenPhotoPickerProps): ReactElement {
  const galleryRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const busy = picking || cameraOpen;
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);

  const add = (incoming: File[]): void => {
    if (incoming.length) onChange(sortByNewest([...files, ...incoming]));
  };

  const pickFrom = async (input: HTMLInputElement | null): Promise<void> => {
    if (!input) return;
    setPicking(true);
    try {
      add(await pickFiles(input));
    } finally {
      setPicking(false);
    }
  };

  const btn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    minHeight: sizes.tapMin,
    padding: '0 0.25rem',
    background: 'transparent',
    border: 'none',
    fontSize: '0.85rem',
    color: tokens.muted,
    cursor: 'pointer',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}>
      <button
        type="button"
        data-soren-take-photo=""
        disabled={disabled}
        onClick={() => setCameraOpen(true)}
        style={btn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
        </svg>
        Take photo now
      </button>

      <button
        type="button"
        data-soren-gallery=""
        disabled={disabled}
        onClick={() => void pickFrom(galleryRef.current)}
        style={btn}
      >
        {picking ? 'Selecting…' : files.length > 0 ? `${files.length} file(s) attached` : 'Add from gallery'}
      </button>

      <input ref={galleryRef} type="file" accept="image/*,video/*" multiple hidden />
      <input ref={captureRef} type="file" accept="image/*" capture="environment" hidden />

      {cameraOpen ? (
        <SorenCamera
          onCapture={(file) => {
            add([file]);
            setCameraOpen(false);
          }}
          onCancel={() => setCameraOpen(false)}
          onUnavailable={() => {
            setCameraOpen(false);
            void pickFrom(captureRef.current); // iOS/WebView fallback
          }}
        />
      ) : null}
    </div>
  );
}
