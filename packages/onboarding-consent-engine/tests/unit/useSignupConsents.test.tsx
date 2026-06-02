/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSignupConsents } from '../../src/client/hooks/useSignupConsents.js';

vi.mock('../../src/client/actions.js', () => ({
  recordSignupConsents: vi.fn(),
}));

import { recordSignupConsents } from '../../src/client/actions.js';

const mockRecord = vi.mocked(recordSignupConsents);

const baseParams = {
  userId: 'user-1',
  tosGranted: true,
  privacyGranted: true,
  aiTrainingGranted: false,
};

describe('useSignupConsents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecord.mockResolvedValue([]);
  });

  it('sets isRecording during record and clears after success', async () => {
    let resolveRecord!: () => void;
    mockRecord.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRecord = () => resolve([]);
        }),
    );

    const { result } = renderHook(() => useSignupConsents());

    let recordPromise: Promise<void>;
    act(() => {
      recordPromise = result.current.record(baseParams);
    });
    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      resolveRecord();
      await recordPromise!;
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls onSuccess with userId on success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSignupConsents({ onSuccess }));

    await act(async () => {
      await result.current.record({ ...baseParams, aiTrainingGranted: true });
    });

    expect(onSuccess).toHaveBeenCalledWith('user-1');
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ aiTrainingGranted: true }),
    );
  });

  it('sets error and calls onError then rethrows on failure', async () => {
    mockRecord.mockRejectedValue(new Error('network fail'));
    const onError = vi.fn();
    const { result } = renderHook(() => useSignupConsents({ onError }));

    await act(async () => {
      await expect(result.current.record(baseParams)).rejects.toThrow('network fail');
    });

    await waitFor(() => {
      expect(result.current.error?.message).toBe('network fail');
    });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'network fail' }));
    expect(result.current.isRecording).toBe(false);
  });
});
