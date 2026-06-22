import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechInput } from '../client/hooks/useSpeechInput.js';

export interface SorenInputProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  speechLang?: string;
}

export function SorenInput({
  placeholder = 'Or just ask me anything...',
  onSubmit,
  disabled = false,
  speechLang = 'en-US',
}: SorenInputProps) {
  const [value, setValue] = useState('');
  const [interim, setInterim] = useState(false);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = useCallback((text?: string) => {
    const trimmed = (text ?? value).trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
    setInterim(false);
  }, [disabled, onSubmit, value]);

  const { isListening, hasError, start, stop } = useSpeechInput({
    lang: speechLang,
    onTranscript: (text, isFinal) => {
      setValue(text);
      setInterim(!isFinal);
      if (isFinal) {
        if (submitTimer.current) clearTimeout(submitTimer.current);
        submitTimer.current = setTimeout(() => submit(text), 800);
      }
    },
    onError: () => setInterim(false),
  });

  useEffect(() => () => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
  }, []);

  const micState = hasError ? 'error' : isListening ? (interim ? 'hearing' : 'listening') : 'idle';

  const handleMic = () => {
    if (disabled) return;
    if (isListening) {
      stop();
      return;
    }
    start();
  };

  return (
    <div className="soren-input-row" data-testid="soren-input">
      <input
        className={`soren-txt-input${interim ? ' soren-txt-interim' : ''}`}
        placeholder={interim ? 'hearing...' : placeholder}
        value={value}
        onChange={(e) => {
          setInterim(false);
          setValue(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        disabled={disabled}
        data-testid="soren-text-input"
      />
      <button
        type="button"
        className={`soren-mic soren-mic-${micState}`}
        onClick={handleMic}
        disabled={disabled}
        aria-label={isListening ? 'Stop listening' : 'Voice input'}
        data-testid="soren-mic-button"
        data-mic-state={micState}
      >
        {micState === 'error' ? '⚠️' : micState === 'hearing' ? (
          <span className="soren-mic-bars" aria-hidden>
            <span /><span /><span />
          </span>
        ) : '🎤'}
      </button>
    </div>
  );
}
