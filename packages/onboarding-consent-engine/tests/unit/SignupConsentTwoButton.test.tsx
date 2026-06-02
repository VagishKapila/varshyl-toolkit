/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SignupConsentTwoButton } from '../../src/client/components/SignupConsentTwoButton.js';

const baseProps = {
  tosUrl: 'https://example.com/terms',
  privacyUrl: 'https://example.com/privacy',
  onSubmit: vi.fn(),
};

describe('SignupConsentTwoButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSubmit(false) when No is clicked', () => {
    const onSubmit = vi.fn();
    render(<SignupConsentTwoButton {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'No, just sign me up' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(false);
  });

  it('calls onSubmit(true) when Yes is clicked', () => {
    const onSubmit = vi.fn();
    render(<SignupConsentTwoButton {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Yes, sign up & count me in' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(true);
  });

  it('renders custom copy and product name in implied consent line', () => {
    render(
      <SignupConsentTwoButton
        {...baseProps}
        productName="Job Site Intel AI"
        questionText="Help train Soren on real construction work?"
        descriptionText="Your anonymized photos and voice notes make Soren smarter."
        noButtonText="No thanks"
        yesButtonText="Count me in"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Job Site Intel AI/)).toBeTruthy();
    expect(screen.getByText('Help train Soren on real construction work?')).toBeTruthy();
    expect(screen.getByText('Your anonymized photos and voice notes make Soren smarter.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'No thanks' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Count me in' })).toBeTruthy();
  });

  it('disables buttons when disabled or isSubmitting', () => {
    const { rerender } = render(
      <SignupConsentTwoButton {...baseProps} disabled onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'No, just sign me up' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Yes, sign up & count me in' })).toHaveProperty(
      'disabled',
      true,
    );

    rerender(<SignupConsentTwoButton {...baseProps} isSubmitting onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'No, just sign me up' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Yes, sign up & count me in' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
