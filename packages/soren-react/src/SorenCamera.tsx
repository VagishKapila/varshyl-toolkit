import { useEffect, useRef, type CSSProperties, type ReactElement } from 'react';
import { sizes, tokens } from './styles.js';

export interface SorenCameraProps {
  /** Receives the captured still as a JPEG File. */
  onCapture: (file: File) => void;
  /** User dismissed the camera. */
  onCancel: () => void;
  /** getUserMedia is unavailable/blocked — caller should fall back to <input>. */
  onUnavailable: () => void;
}

/**
 * Full-screen live camera capture using the Web getUserMedia API
 * (`facingMode: environment` for the rear lens). On any failure it calls
 * `onUnavailable` so the caller can fall back to a native capture input
 * (iOS Safari / Android WebView). Web APIs only — no native plugins.
 */
export function SorenCamera({ onCapture, onCancel, onUnavailable }: SorenCameraProps): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    const media = navigator?.mediaDevices;
    if (!media?.getUserMedia) {
      onUnavailable();
      return;
    }
    media
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play().catch(() => undefined);
        }
      })
      .catch(() => onUnavailable());
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [onUnavailable]);

  const capture = (): void => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], `soren-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  };

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
  };
  const ctrl = (primary: boolean): CSSProperties => ({
    minHeight: sizes.tapMin,
    minWidth: sizes.tapMin,
    padding: '0.75rem 1.25rem',
    borderRadius: '999px',
    border: primary ? 'none' : `1px solid ${tokens.onAccent}`,
    background: primary ? tokens.accent : 'transparent',
    color: tokens.onAccent,
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div data-soren-camera="" role="dialog" aria-label="Take a photo" style={overlay}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ flex: 1, width: '100%', objectFit: 'cover', minHeight: 0 }}
      />
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          padding: `1rem 1rem calc(1rem + env(safe-area-inset-bottom))`,
        }}
      >
        <button type="button" onClick={onCancel} style={ctrl(false)}>
          Cancel
        </button>
        <button type="button" onClick={capture} style={ctrl(true)}>
          Capture
        </button>
      </div>
    </div>
  );
}
