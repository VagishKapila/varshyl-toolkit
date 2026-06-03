/**
 * Copy-paste starting point: two-button signup consent (OCE 0.4+).
 *
 * Install: npm install @varshylinc/onboarding-consent-engine
 * Server: run migrations + mount consent API — see packages/onboarding-consent-engine/README.md
 *
 * Pair with examples/auth-social-react-signup.tsx via consentSlot, or use standalone after createUser.
 */
'use client';

import {
  SignupConsentTwoButton,
  useSignupConsents,
} from '@varshylinc/onboarding-consent-engine/client';

type CreatedUser = { id: string };

async function createUser(_opts: {
  email: string;
  password: string;
}): Promise<CreatedUser> {
  // Your app's signup API — returns the new user id.
  throw new Error('Implement createUser() for your product');
}

export function SignupConsentSection() {
  const { record, isRecording, error } = useSignupConsents({
    onSuccess: (userId) => {
      console.log('Consents recorded for', userId);
      window.location.href = '/home';
    },
  });

  const handleConsentSubmit = async (aiTrainingGranted: boolean) => {
    const user = await createUser({ email: '', password: '' });
    await record({
      userId: user.id,
      tosGranted: true,
      privacyGranted: true,
      aiTrainingGranted,
      apiBaseUrl: '/api/consent',
    });
  };

  return (
    <>
      <SignupConsentTwoButton
        tosUrl="https://yoursite.com/terms"
        privacyUrl="https://yoursite.com/privacy"
        productName="Your Product"
        questionText="Help train AI on real work?"
        descriptionText="Your anonymized data makes the AI smarter for everyone."
        noButtonText="No, just sign me up"
        yesButtonText="Yes, sign up & count me in"
        onSubmit={handleConsentSubmit}
        isSubmitting={isRecording}
      />
      {error ? <p role="alert">{error.message}</p> : null}
    </>
  );
}
