import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  INITIAL_VOICE_STATE,
  voiceReducer,
  type VoiceEvent,
} from '../src/stateMachine.js';
import type { VoiceState } from '../src/types.js';

afterEach(() => {
  vi.resetAllMocks();
});

function run(events: VoiceEvent[], start: VoiceState = INITIAL_VOICE_STATE): VoiceState {
  return events.reduce(voiceReducer, start);
}

describe('voiceReducer', () => {
  it('starts idle', () => {
    expect(INITIAL_VOICE_STATE).toBe('idle');
  });

  it('connects: idle -> connecting -> idle', () => {
    expect(voiceReducer('idle', { type: 'CONNECT' })).toBe('connecting');
    expect(voiceReducer('connecting', { type: 'CONNECTED' })).toBe('idle');
  });

  it('runs a full turn: idle -> listening -> processing -> speaking -> idle', () => {
    expect(
      run([
        { type: 'START_LISTENING' },
        { type: 'TRANSCRIPT_RECEIVED' },
        { type: 'SPEAKING' },
        { type: 'DONE' },
      ]),
    ).toBe('idle');
  });

  it('maps START_LISTENING -> TRANSCRIPT_RECEIVED to processing', () => {
    expect(run([{ type: 'START_LISTENING' }, { type: 'TRANSCRIPT_RECEIVED' }])).toBe(
      'processing',
    );
  });

  it('ERROR is reachable from any state', () => {
    const states: VoiceState[] = ['idle', 'connecting', 'listening', 'processing', 'speaking'];
    for (const s of states) {
      expect(voiceReducer(s, { type: 'ERROR', message: 'boom' })).toBe('error');
    }
  });

  it('RESET always returns to idle', () => {
    expect(voiceReducer('error', { type: 'RESET' })).toBe('idle');
    expect(voiceReducer('speaking', { type: 'RESET' })).toBe('idle');
  });

  it('ignores invalid transitions (no-op)', () => {
    expect(voiceReducer('idle', { type: 'CONNECTED' })).toBe('idle');
    expect(voiceReducer('idle', { type: 'DONE' })).toBe('idle');
    expect(voiceReducer('speaking', { type: 'CONNECT' })).toBe('speaking');
  });
});
