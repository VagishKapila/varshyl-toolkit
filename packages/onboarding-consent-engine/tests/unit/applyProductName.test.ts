import { describe, it, expect } from 'vitest';
import { applyProductName } from '../../src/server/templates/applyProductName.js';

describe('applyProductName', () => {
  it('replaces {{PRODUCT_NAME}} placeholder', () => {
    expect(applyProductName('I agree to the {{PRODUCT_NAME}} Terms.', 'ConstructInv')).toBe(
      'I agree to the ConstructInv Terms.',
    );
  });

  it('replaces multiple occurrences', () => {
    expect(
      applyProductName('{{PRODUCT_NAME}} is cool. Use {{PRODUCT_NAME}}.', 'DailyLog'),
    ).toBe('DailyLog is cool. Use DailyLog.');
  });

  it('leaves strings without placeholder unchanged', () => {
    expect(applyProductName('No placeholder here.', 'X')).toBe('No placeholder here.');
  });
});
