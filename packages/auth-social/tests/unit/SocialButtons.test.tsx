import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import React from 'react';
import { AuthThemeProvider } from '../../src/client/theme.js';
import { SocialButtons } from '../../src/client/components/SocialButtons.js';

afterEach(() => {
  cleanup();
});

function renderSocial(props: Partial<React.ComponentProps<typeof SocialButtons>> = {}) {
  const onApple = vi.fn();
  const onGoogle = vi.fn();
  const view = render(
    <AuthThemeProvider>
      <SocialButtons onApple={onApple} onGoogle={onGoogle} {...props} />
    </AuthThemeProvider>,
  );
  return { onApple, onGoogle, root: view.container };
}

describe('SocialButtons', () => {
  it('renders Apple above Google on web by default', () => {
    const { root } = renderSocial();
    const buttons = within(root).getAllByTestId(/sign-in-/);
    expect(buttons.map(b => b.getAttribute('data-testid'))).toEqual(['sign-in-apple', 'sign-in-google']);
  });

  it('uses official logos in default official variant', () => {
    const { root } = renderSocial();
    const apple = within(root).getByTestId('sign-in-apple');
    expect(apple.querySelector('svg')).toBeTruthy();
    expect(apple.textContent).toContain('Sign in with Apple');
  });

  it('supports sign-up copy via mode', () => {
    const { root } = renderSocial({ mode: 'signUp' });
    expect(within(root).getByTestId('sign-in-apple').textContent).toContain('Sign up with Apple');
    expect(within(root).getByTestId('sign-in-google').textContent).toContain('Sign up with Google');
  });
});
