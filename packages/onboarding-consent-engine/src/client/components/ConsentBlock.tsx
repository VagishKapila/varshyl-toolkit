import React from 'react';
import type { ConsentDefinition } from '../../shared/types.js';
import { ConsentCheckbox } from './ConsentCheckbox.js';

export interface ConsentBlockProps {
  requiredConsents: ConsentDefinition[];
  optionalConsents: ConsentDefinition[];
  /** Array of definition keys the user has currently checked/granted */
  value: string[];
  onChange: (keys: string[]) => void;
  productName: string;
  legalLinks?: Record<string, string>;
  disabled?: boolean;
}

export function ConsentBlock({
  requiredConsents,
  optionalConsents,
  value,
  onChange,
  legalLinks,
  disabled,
}: ConsentBlockProps) {
  const toggle = (key: string, checked: boolean) => {
    if (checked) {
      onChange([...value, key]);
    } else {
      onChange(value.filter((k) => k !== key));
    }
  };

  return (
    <div className="space-y-1">
      {requiredConsents.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Required
          </p>
          {requiredConsents.map((def) => (
            <ConsentCheckbox
              key={def.key}
              id={`consent-${def.key}`}
              checked={value.includes(def.key)}
              onChange={(checked) => toggle(def.key, checked)}
              label={def.display_text}
              required
              legalUrl={legalLinks?.[def.key] ?? def.legal_url}
              disabled={disabled}
            />
          ))}
        </div>
      )}
      {optionalConsents.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Optional
          </p>
          {optionalConsents.map((def) => (
            <ConsentCheckbox
              key={def.key}
              id={`consent-${def.key}`}
              checked={value.includes(def.key)}
              onChange={(checked) => toggle(def.key, checked)}
              label={def.display_text}
              legalUrl={legalLinks?.[def.key] ?? def.legal_url}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
