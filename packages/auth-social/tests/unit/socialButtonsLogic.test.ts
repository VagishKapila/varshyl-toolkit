import { describe, expect, it } from 'vitest';
import { resolveSocialProviders, shouldWarnAppStore48 } from '../../src/client/socialButtonsLogic.js';

describe('resolveSocialProviders', () => {
  it('defaults to apple then google on web', () => {
    expect(resolveSocialProviders({})).toEqual(['apple', 'google']);
  });

  it('keeps apple above google', () => {
    expect(resolveSocialProviders({ providers: ['google', 'apple'] })).toEqual(['apple', 'google']);
  });

  it('respects showApple=false', () => {
    expect(resolveSocialProviders({ showApple: false })).toEqual(['google']);
  });

  it('respects providers list only google', () => {
    expect(resolveSocialProviders({ providers: ['google'] })).toEqual(['google']);
  });
});

describe('shouldWarnAppStore48', () => {
  it('warns when google without apple', () => {
    expect(shouldWarnAppStore48(false, ['google'])).toBe(true);
  });

  it('does not warn when both shown', () => {
    expect(shouldWarnAppStore48(undefined, ['apple', 'google'])).toBe(false);
  });
});
