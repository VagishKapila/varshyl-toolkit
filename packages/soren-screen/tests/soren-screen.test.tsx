// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { referenceConfig } from '../src/adapters/reference/index.js';
import { SorenInput } from '../src/react/SorenInput.js';
import { SorenScreen } from '../src/react/SorenScreen.js';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  onresult: ((event: { results: Array<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  mode: 'interim' | 'final' = 'final';

  start() {
    if (this.mode === 'interim') {
      this.onresult?.({
        results: [{ 0: { transcript: 'How do I' }, isFinal: false }],
      });
      return;
    }
    this.onresult?.({
      results: [{ 0: { transcript: 'How do I create a log' }, isFinal: true }],
    });
    queueMicrotask(() => this.onend?.());
  }

  stop() {
    this.onend?.();
  }

  abort() {}
}

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
    (window as Window & { SpeechRecognition?: typeof MockSpeechRecognition }).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

describe('SorenInput voice', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    (window as Window & { SpeechRecognition?: typeof MockSpeechRecognition }).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('mic button renders in idle state', () => {
    render(<SorenInput onSubmit={onSubmit} />);
    expect(screen.getByTestId('soren-mic-button').getAttribute('data-mic-state')).toBe('idle');
  });

  it('mic button enters listening state on tap', async () => {
    render(<SorenInput onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('soren-mic-button'));
    await waitFor(() => {
      expect(screen.getByTestId('soren-mic-button').getAttribute('data-mic-state')).not.toBe('idle');
    });
  });

  it('interim transcript shows in input field', async () => {
    (window as Window & { SpeechRecognition?: typeof MockSpeechRecognition }).SpeechRecognition = class extends MockSpeechRecognition {
      mode = 'interim' as const;
    };
    render(<SorenInput onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('soren-mic-button'));
    await waitFor(() => {
      const input = screen.getByTestId('soren-text-input') as HTMLInputElement;
      expect(input.value).toBe('How do I');
    });
  });

  it('final transcript auto-submits to Q&A', async () => {
    (window as Window & { SpeechRecognition?: typeof MockSpeechRecognition }).SpeechRecognition = MockSpeechRecognition;
    render(<SorenInput onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('soren-mic-button'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('How do I create a log');
    }, { timeout: 2000 });
  });
});
