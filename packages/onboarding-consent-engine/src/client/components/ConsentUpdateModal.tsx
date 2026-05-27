import React from 'react';
import type { ConsentDefinition } from '../../shared/types.js';
import { ConsentBlock } from './ConsentBlock.js';

export interface ConsentUpdateModalProps {
  productName: string;
  updatedConsents: ConsentDefinition[];
  value: string[];
  onChange: (keys: string[]) => void;
  onAccept: () => void;
  loading?: boolean;
  legalLinks?: Record<string, string>;
}

export function ConsentUpdateModal({
  productName,
  updatedConsents,
  value,
  onChange,
  onAccept,
  loading,
  legalLinks,
}: ConsentUpdateModalProps) {
  const required = updatedConsents.filter((d) => d.required);
  const optional = updatedConsents.filter((d) => !d.required);
  const allRequiredGranted = required.every((d) => value.includes(d.key));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {productName} has updated its policies
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Please review and accept the updated terms to continue.
        </p>

        <ConsentBlock
          requiredConsents={required}
          optionalConsents={optional}
          value={value}
          onChange={onChange}
          productName={productName}
          legalLinks={legalLinks}
          disabled={loading}
        />

        <button
          onClick={onAccept}
          disabled={!allRequiredGranted || loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition-colors"
        >
          {loading ? 'Saving…' : 'Accept & Continue'}
        </button>
      </div>
    </div>
  );
}
