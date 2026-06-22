import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

function getWebSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

async function tryCapacitorListen(
  lang: string,
  onTranscript: (text: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    const mod = await import('@capacitor-community/speech-recognition');
    const SpeechRecognition = mod.SpeechRecognition;
    const permission = await SpeechRecognition.requestPermissions();
    if (permission.speechRecognition !== 'granted') {
      onError?.('Microphone permission denied');
      return true;
    }
    const result = await SpeechRecognition.start({
      language: lang,
      maxResults: 1,
      prompt: 'Ask Soren anything',
      partialResults: true,
      popup: true,
    });
    const matches = result.matches ?? [];
    const text = matches[0] ?? '';
    if (text) onTranscript(text, true);
    return true;
  } catch {
    return false;
  }
}

export interface UseSpeechInputOptions {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechInputResult {
  isListening: boolean;
  isSupported: boolean;
  hasError: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechInput(options: UseSpeechInputOptions): UseSpeechInputResult {
  const lang = options.lang ?? 'en-US';
  const [isListening, setIsListening] = useState(false);
  const [hasError, setHasError] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const webCtor = getWebSpeechCtor();
  const isSupported = Boolean(webCtor) || typeof window !== 'undefined';

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    setHasError(false);

    void (async () => {
      const usedCapacitor = await tryCapacitorListen(lang, options.onTranscript, (error) => {
        setHasError(true);
        options.onError?.(error);
      });
      if (usedCapacitor) return;

      const Ctor = getWebSpeechCtor();
      if (!Ctor) {
        setHasError(true);
        options.onError?.('Voice input not supported on this browser');
        return;
      }

      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? '')
          .join(' ')
          .trim();
        if (!transcript) return;
        const last = event.results[event.results.length - 1] as { isFinal?: boolean };
        const isFinal = last?.isFinal === true;
        options.onTranscript(transcript, isFinal);
      };
      recognition.onerror = (event) => {
        setHasError(true);
        setIsListening(false);
        options.onError?.(event.error);
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    })();
  }, [lang, options.onError, options.onTranscript]);

  useEffect(() => () => stop(), [stop]);

  return { isListening, isSupported, hasError, start, stop };
}
