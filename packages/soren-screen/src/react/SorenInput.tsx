import { useState } from 'react';

export interface SorenInputProps {
  placeholder?: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function SorenInput({
  placeholder = 'Or just ask me anything...',
  onSubmit,
  disabled = false,
}: SorenInputProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <div className="soren-input-row" data-testid="soren-input">
      <input
        className="soren-txt-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        disabled={disabled}
      />
      <button type="button" className="soren-mic" onClick={submit} disabled={disabled} aria-label="Send">
        🎤
      </button>
    </div>
  );
}
