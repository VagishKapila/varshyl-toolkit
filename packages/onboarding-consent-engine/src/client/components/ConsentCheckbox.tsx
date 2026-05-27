import React from 'react';

export interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
  legalUrl?: string | null;
  disabled?: boolean;
}

export function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  required,
  legalUrl,
  disabled,
}: ConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-required={required}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor={id} className="text-sm text-gray-700 leading-snug">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
        {legalUrl && (
          <a
            href={legalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-600 underline"
          >
            (view)
          </a>
        )}
      </label>
    </div>
  );
}
