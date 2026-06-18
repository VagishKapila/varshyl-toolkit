import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DeviceTokenStore } from '../../src/types.js';
import { sendPush, sendPushToSegment } from '../../src/server/send.js';
import * as fcm from '../../src/server/fcm.js';

const credentials = {
  projectId: 'test-project',
  serviceAccount: { project_id: 'test-project', client_email: 'x', private_key: 'y' },
};

describe('sendPush', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty report when push disabled', async () => {
    const store: DeviceTokenStore = {
      register: vi.fn(),
      unregister: vi.fn(),
      listEligible: vi.fn(),
      tokensForUser: vi.fn().mockResolvedValue(['tok-1']),
      removeTokens: vi.fn(),
    };

    const report = await sendPush(store, 'user-1', 'org-1', {
      title: 'Hi',
      body: 'There',
    }, { enabled: false });

    expect(report).toEqual({ sent: 0, failed: 0, failedTokens: [] });
  });

  it('sends to user tokens and removes invalid tokens', async () => {
    const store: DeviceTokenStore = {
      register: vi.fn(),
      unregister: vi.fn(),
      listEligible: vi.fn(),
      tokensForUser: vi.fn().mockResolvedValue(['tok-1', 'tok-2']),
      removeTokens: vi.fn(),
    };

    vi.spyOn(fcm, 'sendFcmMulticast').mockResolvedValue({
      sent: 1,
      failed: 1,
      invalidTokens: ['tok-2'],
    });

    const report = await sendPush(store, 'user-1', 'org-1', {
      title: 'Hi',
      body: 'There',
      route: '/home',
    }, { enabled: true, credentials });

    expect(report.sent).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.failedTokens).toEqual(['tok-2']);
    expect(store.removeTokens).toHaveBeenCalledWith(['tok-2']);
    expect(fcm.sendFcmMulticast).toHaveBeenCalledWith(
      credentials,
      expect.objectContaining({
        tokens: ['tok-1', 'tok-2'],
        data: expect.objectContaining({ route: '/home' }),
      }),
    );
  });
});

describe('sendPushToSegment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('dedupes tokens and returns delivery report for Hub broadcast', async () => {
    vi.spyOn(fcm, 'sendFcmMulticast').mockResolvedValue({
      sent: 2,
      failed: 0,
      invalidTokens: [],
    });

    const report = await sendPushToSegment(
      ['a', 'a', 'b'],
      { title: 'Broadcast', body: 'Hello everyone' },
      { enabled: true, credentials },
    );

    expect(report).toEqual({ sent: 2, failed: 0, failedTokens: [] });
    expect(fcm.sendFcmMulticast).toHaveBeenCalledWith(
      credentials,
      expect.objectContaining({ tokens: ['a', 'b'] }),
    );
  });
});
