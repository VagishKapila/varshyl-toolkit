import { useEffect, type RefObject } from 'react';

type AudioCtor = typeof AudioContext;

function getAudioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * While `active`, samples mic amplitude via a Web Audio AnalyserNode and writes
 * each bar's height (20%–100%) directly to the DOM (RAF loop, no React renders).
 * On teardown it stops the stream, closes the context, and clears inline heights
 * so CSS state animations resume. Silently no-ops without getUserMedia/AudioContext.
 */
export function useAudioLevels(active: boolean, bars: RefObject<HTMLElement>[]): void {
  useEffect(() => {
    if (!active) return;
    const Ctor = getAudioCtor();
    const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!Ctor || !media?.getUserMedia) return;

    let cancelled = false;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    media
      .getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new Ctor();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        ctx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = (): void => {
          analyser.getByteFrequencyData(data);
          bars.forEach((ref, i) => {
            const v = data[i * 2 + 1] ?? 0;
            const el = ref.current;
            if (el) el.style.height = `${20 + (v / 255) * 80}%`;
          });
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      bars.forEach((ref) => {
        if (ref.current) ref.current.style.height = '';
      });
    };
  }, [active, bars]);
}
