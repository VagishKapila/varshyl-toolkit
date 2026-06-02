'use client';

import './SignupConsentTwoButton.css';

export interface SignupConsentTwoButtonProps {
  questionText?: string;
  descriptionText?: string;
  tosUrl: string;
  privacyUrl: string;
  productName?: string;
  noButtonText?: string;
  yesButtonText?: string;
  onSubmit: (aiTrainingGranted: boolean) => void | Promise<void>;
  isSubmitting?: boolean;
  noButtonClassName?: string;
  yesButtonClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
}

export function SignupConsentTwoButton({
  questionText = 'Help train AI on real work?',
  descriptionText = 'Your anonymized data makes the AI smarter for everyone.',
  tosUrl,
  privacyUrl,
  productName,
  noButtonText = 'No, just sign me up',
  yesButtonText = 'Yes, sign up & count me in',
  onSubmit,
  isSubmitting = false,
  noButtonClassName = '',
  yesButtonClassName = '',
  containerClassName = '',
  disabled = false,
}: SignupConsentTwoButtonProps) {
  const handleNo = () => {
    void onSubmit(false);
  };
  const handleYes = () => {
    void onSubmit(true);
  };

  const impliedLead = productName
    ? `By signing up for ${productName}, you agree to our`
    : 'By signing up, you agree to our';

  return (
    <div className={`oce-two-button-container ${containerClassName}`.trim()}>
      <p className="oce-implied-consent">
        {impliedLead}{' '}
        <a href={tosUrl} target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        .
      </p>

      <div className="oce-ai-prompt">
        <h3>{questionText}</h3>
        <p>{descriptionText}</p>
      </div>

      <div className="oce-two-button-group">
        <button
          type="button"
          onClick={handleNo}
          disabled={disabled || isSubmitting}
          className={`oce-no-button ${noButtonClassName}`.trim()}
          aria-label={noButtonText}
        >
          {noButtonText}
        </button>
        <button
          type="button"
          onClick={handleYes}
          disabled={disabled || isSubmitting}
          className={`oce-yes-button ${yesButtonClassName}`.trim()}
          aria-label={yesButtonText}
        >
          {yesButtonText}
        </button>
      </div>
    </div>
  );
}
