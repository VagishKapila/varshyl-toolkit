// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { referenceConfig } from '../src/adapters/reference/index.js';
import { SorenScreen } from '../src/react/SorenScreen.js';

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
});

const testConfig = {
  ...referenceConfig,
  greeting: () => 'Hello, there. Welcome to the reference Soren screen.',
  qaAdapter: async (query: string) => ({
    answer: `Echo: ${query}`,
    confidence: 1,
    outOfScope: false,
  }),
};

describe('SorenScreen', () => {
  beforeEach(() => {
    storage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    render(<SorenScreen config={testConfig} />);
    expect(screen.getByTestId('soren-screen')).toBeTruthy();
  });

  it('shows greeting intro', () => {
    render(<SorenScreen config={testConfig} />);
    expect(screen.getByTestId('soren-greeting')).toBeTruthy();
    expect(screen.getByText(/Hi, I'm Soren/i)).toBeTruthy();
  });

  it('renders identity title chips', () => {
    render(<SorenScreen config={testConfig} />);
    expect(screen.getByTestId('soren-identity')).toBeTruthy();
    for (const title of testConfig.titleOptions) {
      expect(screen.getByRole('button', { name: title })).toBeTruthy();
    }
  });
});
