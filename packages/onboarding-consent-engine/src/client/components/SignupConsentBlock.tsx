import React from 'react';
import { DEFAULT_AI_TRAINING_LABEL } from '../../shared/signupConsent.js';
import { setAiTrainingConsent } from '../actions.js';

export interface SignupConsentBlockProps {
  termsUrl: string;
  privacyUrl: string;
  /** Explicit AI-training consent — initialize to false (unchecked by default). */
  aiTrainingChecked: boolean;
  onAiTrainingChange: (checked: boolean) => void;
  /** Override default owner-approved copy if needed. */
  aiTrainingLabel?: string;
  learnMoreUrl?: string;
  /** Phrase after "By …" — default matches locked spec ("signing in"). */
  actionPhrase?: string;
  disabled?: boolean;
}

export function SignupConsentBlock({
  termsUrl,
  privacyUrl,
  aiTrainingChecked,
  onAiTrainingChange,
  aiTrainingLabel = DEFAULT_AI_TRAINING_LABEL,
  learnMoreUrl,
  actionPhrase = 'signing in',
  disabled,
}: SignupConsentBlockProps) {
  const handleAiTrainingChange = async (checked: boolean) => {
    const next = await setAiTrainingConsent(checked);
    onAiTrainingChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 leading-snug">
        By {actionPhrase}, you agree to our{' '}
        <a
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Privacy Policy
        </a>
        .
      </p>

      <div className="flex items-start gap-3">
        <input
          id="signup-consent-ai-training"
          type="checkbox"
          checked={aiTrainingChecked}
          onChange={(e) => void handleAiTrainingChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          htmlFor="signup-consent-ai-training"
          className="text-sm text-gray-700 leading-snug"
        >
          {aiTrainingLabel}
          {learnMoreUrl && (
            <>
              {' '}
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Learn more
              </a>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
