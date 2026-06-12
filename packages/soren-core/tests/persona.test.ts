import { describe, expect, it } from 'vitest';
import sorenPersona, { buildPersonaPrompt } from '../src/persona.js';

describe('persona', () => {
  it('exports a product-neutral Soren default', () => {
    expect(sorenPersona.name).toBe('Soren');
    expect(sorenPersona.defaultVoiceProfile).toBe('calm');
    expect(sorenPersona.systemPrompt).toContain('Soren');
  });

  it('does not embed owner-specific copy or a passphrase', () => {
    const lower = sorenPersona.systemPrompt.toLowerCase();
    expect(lower).not.toContain('passphrase');
    expect(lower).not.toContain('vagish');
  });

  it('buildPersonaPrompt() returns the default when no overrides', () => {
    expect(buildPersonaPrompt()).toContain('You are Soren');
  });

  it('applies name + productContext + additionalGuidance overrides', () => {
    const prompt = buildPersonaPrompt({
      name: 'Aria',
      productContext: 'You help with construction billing.',
      additionalGuidance: 'Always confirm dollar amounts.',
    });
    expect(prompt).toContain('You are Aria');
    expect(prompt).toContain('construction billing');
    expect(prompt).toContain('confirm dollar amounts');
  });

  it('systemPrompt override wins outright', () => {
    expect(buildPersonaPrompt({ systemPrompt: 'CUSTOM' })).toBe('CUSTOM');
  });
});
