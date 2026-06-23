import React from 'react';

/** Notes and descriptions — autocorrect on, spellcheck on, sentence capitalization. */
export function VarshylTextInput(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
): React.ReactElement {
  return (
    <textarea
      autoCorrect="on"
      spellCheck
      autoCapitalize="sentences"
      autoComplete="on"
      {...props}
    />
  );
}

/** Email fields — no autocorrect/capitalize; browser email autocomplete. */
export function VarshylEmailInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.ReactElement {
  return (
    <input
      type="email"
      autoCorrect="off"
      autoCapitalize="none"
      autoComplete="email"
      spellCheck={false}
      {...props}
    />
  );
}

/** Address fields — word capitalization; street-address autocomplete. */
export function VarshylAddressInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.ReactElement {
  return (
    <input
      type="text"
      autoCorrect="off"
      autoCapitalize="words"
      autoComplete="street-address"
      {...props}
    />
  );
}

/** Search fields — no autocorrect, capitalize, or spellcheck. */
export function VarshylSearchInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.ReactElement {
  return (
    <input
      type="search"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      autoComplete="off"
      {...props}
    />
  );
}

export interface VarshylPasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 'signin' → current-password (default); 'signup' → new-password */
  mode?: 'signin' | 'signup';
}

/** Password fields — no autocorrect/capitalize; password autocomplete. */
export function VarshylPasswordInput({
  mode = 'signin',
  ...props
}: VarshylPasswordInputProps): React.ReactElement {
  const autoComplete = mode === 'signup' ? 'new-password' : 'current-password';

  return (
    <input
      type="password"
      autoCorrect="off"
      autoCapitalize="none"
      autoComplete={autoComplete}
      {...props}
    />
  );
}
