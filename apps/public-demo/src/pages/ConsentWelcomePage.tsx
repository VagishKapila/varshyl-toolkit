import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WelcomeScreen } from '@varshylinc/onboarding-consent-engine/client';
import { DemoShell } from '../components/DemoShell.js';

interface DemoConsentDefinition {
  id: number;
  key: string;
  version: number;
  required: boolean;
  display_text: string;
  legal_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const requiredConsents: DemoConsentDefinition[] = [
  {
    id: 1,
    key: 'terms_of_service',
    version: 1,
    required: true,
    display_text: 'I agree to the Job Site Intel Terms of Service.',
    legal_url: 'https://example.com/terms',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    key: 'privacy_policy',
    version: 1,
    required: true,
    display_text: 'I agree to the Job Site Intel Privacy Policy.',
    legal_url: 'https://example.com/privacy',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const optionalConsents: DemoConsentDefinition[] = [
  {
    id: 3,
    key: 'ai_training',
    version: 1,
    required: false,
    display_text:
      'Help improve construction intelligence by sharing your anonymized project data.',
    legal_url: 'https://example.com/ai-training',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export function ConsentWelcomePage(): React.ReactElement {
  const [value, setValue] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  return (
    <DemoShell title="onboarding-consent-engine — Welcome screen">
      <WelcomeScreen
        productName="Job Site Intel"
        requiredConsents={requiredConsents}
        optionalConsents={optionalConsents}
        value={value}
        onChange={setValue}
        onContinue={() => setSaved(true)}
        legalLinks={{
          terms_of_service: 'https://example.com/terms',
          privacy_policy: 'https://example.com/privacy',
          ai_training: 'https://example.com/ai-training',
        }}
      />
      {saved && (
        <p className="text-center text-sm mt-4" style={{ color: '#8B3A2F' }}>
          Consents saved (mock) — selected: {value.join(', ') || 'none'}
        </p>
      )}
      <p className="mt-4 text-sm text-center">
        <Link to="/" style={{ color: '#8B3A2F' }}>
          ← All screens
        </Link>
      </p>
    </DemoShell>
  );
}
