import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  VarshylAddressInput,
  VarshylEmailInput,
  VarshylPasswordInput,
  VarshylSearchInput,
  VarshylTextInput,
} from '../../src/react/components.js';

describe('Varshyl input defaults', () => {
  it('VarshylTextInput uses textarea with note-friendly keyboard attrs', () => {
    const { container } = render(<VarshylTextInput data-testid="text" />);
    const el = container.querySelector('textarea');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('autocorrect')).toBe('on');
    expect(el?.getAttribute('spellcheck')).toBe('true');
    expect(el?.getAttribute('autocapitalize')).toBe('sentences');
  });

  it('VarshylEmailInput uses email type and email autocomplete', () => {
    const { container } = render(<VarshylEmailInput data-testid="email" />);
    const el = container.querySelector('input');
    expect(el?.type).toBe('email');
    expect(el?.getAttribute('autocomplete')).toBe('email');
    expect(el?.getAttribute('autocorrect')).toBe('off');
    expect(el?.getAttribute('autocapitalize')).toBe('none');
    expect(el?.getAttribute('spellcheck')).toBe('false');
  });

  it('VarshylAddressInput uses street-address autocomplete', () => {
    const { container } = render(<VarshylAddressInput />);
    const el = container.querySelector('input');
    expect(el?.getAttribute('autocomplete')).toBe('street-address');
    expect(el?.getAttribute('autocapitalize')).toBe('words');
    expect(el?.getAttribute('autocorrect')).toBe('off');
  });

  it('VarshylSearchInput uses search type without spellcheck', () => {
    const { container } = render(<VarshylSearchInput />);
    const el = container.querySelector('input');
    expect(el?.type).toBe('search');
    expect(el?.getAttribute('autocorrect')).toBe('off');
    expect(el?.getAttribute('spellcheck')).toBe('false');
  });

  it('VarshylPasswordInput uses password autocomplete', () => {
    const { container } = render(<VarshylPasswordInput />);
    const el = container.querySelector('input');
    expect(el?.type).toBe('password');
    expect(el?.getAttribute('autocomplete')).toBe('current-password');
    expect(el?.getAttribute('autocorrect')).toBe('off');
  });

  it('passes through className and value', () => {
    const { container } = render(
      <VarshylEmailInput className="my-field" value="a@b.co" readOnly />,
    );
    const el = container.querySelector('input');
    expect(el?.className).toBe('my-field');
    expect(el?.value).toBe('a@b.co');
  });
});
