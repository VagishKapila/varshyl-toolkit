'use client';

import { useState, useCallback } from 'react';
import { recordSignupConsents } from '../actions.js';
import type { RecordSignupConsentsClientParams } from '../actions.js';

export type RecordSignupConsentsParams = RecordSignupConsentsClientParams;

export interface UseSignupConsentsOptions {
  onSuccess?: (userId: string) => void;
  onError?: (error: Error) => void;
}

export function useSignupConsents(options?: UseSignupConsentsOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const record = useCallback(
    async (params: RecordSignupConsentsParams) => {
      setIsRecording(true);
      setError(null);
      try {
        await recordSignupConsents(params);
        options?.onSuccess?.(params.userId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options?.onError?.(e);
        throw e;
      } finally {
        setIsRecording(false);
      }
    },
    [options],
  );

  return { record, isRecording, error };
}
