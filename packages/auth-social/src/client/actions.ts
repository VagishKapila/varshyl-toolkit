import type { AuthActionResult, Session } from '../types.js';
import { getApiBaseUrl, getSocialProvider } from './configure.js';

const SESSION_KEY = 'as_session_token';

export function getStoredSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function storeSessionToken(token: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

function sessionResult(session: Session): AuthActionResult {
  storeSessionToken(session.token);
  return { ok: true, session };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
  try {
    const session = await postJson<Session>('/signin', { email, password });
    return sessionResult(session);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<AuthActionResult> {
  try {
    const session = await postJson<Session>('/signup', { email, password, name });
    return sessionResult(session);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signInWithApple(): Promise<AuthActionResult> {
  try {
    const { idToken } = await getSocialProvider().login('apple');
    const session = await postJson<Session>('/signin/provider', { provider: 'apple', idToken });
    return sessionResult(session);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signInWithGoogle(): Promise<AuthActionResult> {
  try {
    const { idToken } = await getSocialProvider().login('google');
    const session = await postJson<Session>('/signin/provider', { provider: 'google', idToken });
    return sessionResult(session);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  try {
    await postJson<{ ok: boolean }>('/password-reset/request', { email });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthActionResult> {
  try {
    await postJson<{ ok: boolean }>('/password-reset/confirm', { token, newPassword });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signOut(): Promise<AuthActionResult> {
  try {
    const token = getStoredSessionToken();
    if (token) {
      await postJson<{ ok: boolean }>('/signout', { token });
    }
    clearSessionToken();
    return { ok: true };
  } catch (e) {
    clearSessionToken();
    return { ok: false, error: (e as Error).message };
  }
}

export async function fetchSession(): Promise<{ userId: string; email: string } | null> {
  const token = getStoredSessionToken();
  if (!token) return null;
  const res = await fetch(`${getApiBaseUrl()}/session`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) {
    clearSessionToken();
    return null;
  }
  return res.json() as Promise<{ userId: string; email: string }>;
}

export const authActions = {
  signInWithEmail,
  signUpWithEmail,
  signInWithApple,
  signInWithGoogle,
  requestPasswordReset,
  resetPassword,
  signOut,
};
