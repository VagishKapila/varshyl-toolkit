import React from 'react';
import type { ConsentDefinition } from '../../shared/types.js';
import { ConsentBlock } from './ConsentBlock.js';

export interface WelcomeScreenProps {
  productName: string;
  requiredConsents: ConsentDefinition[];
  optionalConsents: ConsentDefinition[];
  value: string[];
  onChange: (keys: string[]) => void;
  onContinue: () => void;
  legalLinks?: Record<string, string>;
  loading?: boolean;
  logo?: React.ReactNode;
}

export function WelcomeScreen({
  productName,
  requiredConsents,
  optionalConsents,
  value,
  onChange,
  onContinue,
  legalLinks,
  loading,
  logo,
}: WelcomeScreenProps) {
  const allRequiredGranted = requiredConsents.every((d) => value.includes(d.key));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {logo && <div className="flex justify-center mb-6">{logo}</div>}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Welcome to {productName}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Before you get started, please review and accept the following.
        </p>

        <ConsentBlock
          requiredConsents={requiredConsents}
          optionalConsents={optionalConsents}
          value={value}
          onChange={onChange}
          productName={productName}
          legalLinks={legalLinks}
          disabled={loading}
        />

        <button
          onClick={onContinue}
          disabled={!allRequiredGranted || loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition-colors"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
