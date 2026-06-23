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
      {...props}
    />
  );
}

/** Password fields — no autocorrect/capitalize; password autocomplete. */
export function VarshylPasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
): React.ReactElement {
  return (
    <input
      type="password"
      autoCorrect="off"
      autoCapitalize="none"
      autoComplete="current-password"
      {...props}
    />
  );
}
