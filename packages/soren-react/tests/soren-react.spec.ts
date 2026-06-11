import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SorenAdapterConfig } from '@varshylinc/soren-core';
import { SorenProvider } from '../src/SorenProvider.js';
import { SorenMicButton } from '../src/SorenMicButton.js';

// Capture the most recently constructed mock Room so tests can drive events.
const lk = vi.hoisted(() => ({ room: null as MockRoomHandle | null }));

interface MockRoomHandle {
  emit: (event: string, ...args: unknown[]) => void;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

vi.mock('livekit-client', () => {
  class FakeRoom {
    private handlers = new Map<string, Array<(...a: unknown[]) => void>>();
    localParticipant = { setMicrophoneEnabled: vi.fn(async () => undefined) };
    connect = vi.fn(async () => undefined);
    disconnect = vi.fn(async () => undefined);

    constructor() {
      lk.room = this as unknown as MockRoomHandle;
    }
    on(event: string, cb: (...a: unknown[]) => void): this {
      const arr = this.handlers.get(event) ?? [];
      arr.push(cb);
      this.handlers.set(event, arr);
      return this;
    }
    off(event: string, cb: (...a: unknown[]) => void): this {
      this.handlers.set(event, (this.handlers.get(event) ?? []).filter((f) => f !== cb));
      return this;
    }
    emit(event: string, ...args: unknown[]): void {
      (this.handlers.get(event) ?? []).forEach((f) => f(...args));
    }
  }
  return {
    Room: FakeRoom,
    RoomEvent: { DataReceived: 'dataReceived', Disconnected: 'disconnected' },
  };
});

const config: SorenAdapterConfig = {
  productId: 'smoke-test',
  apiBaseUrl: 'https://api.test',
  getAuthToken: () => 'host-token',
  tools: [],
};

function renderButton(): void {
  render(createElement(SorenProvider, { config, children: createElement(SorenMicButton) }));
}

function micState(): string | null {
  return screen.getByRole('button').getAttribute('data-state');
}

function emitAgentState(signal: string): void {
  const payload = new TextEncoder().encode(signal);
  act(() => {
    lk.room?.emit('dataReceived', payload, undefined, undefined, 'agent-state');
  });
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ serverUrl: 'wss://livekit.test', token: 'lk-token' }),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  lk.room = null;
});

describe('SorenMicButton + SorenProvider (mocked LiveKit)', () => {
  it('renders the idle state correctly', async () => {
    renderButton();
    const btn = screen.getByRole('button');
    expect(btn).toHaveProperty('tagName', 'BUTTON');
    // After the connect lifecycle settles, the button rests at idle.
    await waitFor(() => expect(micState()).toBe('idle'));
    expect(btn.getAttribute('aria-label')).toBe('Start voice session');
  });

  it('transitions idle -> listening -> processing -> idle', async () => {
    renderButton();
    await waitFor(() => expect(micState()).toBe('idle'));

    // idle -> listening (user taps mic)
    fireEvent.click(screen.getByRole('button'));
    expect(micState()).toBe('listening');

    // listening -> processing (agent starts thinking)
    emitAgentState('thinking');
    expect(micState()).toBe('processing');

    // processing -> idle (agent done)
    emitAgentState('idle');
    expect(micState()).toBe('idle');
  });

  it('connects via the mocked LiveKit room without a real connection', async () => {
    renderButton();
    await waitFor(() => expect(lk.room?.connect).toHaveBeenCalledTimes(1));
    expect(lk.room?.connect).toHaveBeenCalledWith('wss://livekit.test', 'lk-token');
  });
});
