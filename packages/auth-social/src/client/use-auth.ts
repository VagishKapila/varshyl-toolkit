import { useCallback, useEffect, useState } from 'react';
import type { AuthActions, AuthState } from '../types.js';
import { authActions, fetchSession } from './actions.js';

export function useAuth(): { state: AuthState; actions: AuthActions; loading: boolean } {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const session = await fetchSession();
    setState({
      userId: session?.userId ?? null,
      email: session?.email ?? null,
      isAuthenticated: session !== null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const wrap = <T extends (...args: never[]) => Promise<{ ok: boolean }>>(fn: T): T => {
    return (async (...args: Parameters<T>) => {
      const result = await fn(...args);
      if (result.ok) await refresh();
      return result;
    }) as T;
  };

  const actions: AuthActions = {
    signInWithEmail: wrap(authActions.signInWithEmail),
    signUpWithEmail: wrap(authActions.signUpWithEmail),
    signInWithApple: wrap(authActions.signInWithApple),
    signInWithGoogle: wrap(authActions.signInWithGoogle),
    requestPasswordReset: wrap(authActions.requestPasswordReset),
    resetPassword: wrap(authActions.resetPassword),
    signOut: wrap(authActions.signOut),
  };

  return { state, actions, loading };
}
