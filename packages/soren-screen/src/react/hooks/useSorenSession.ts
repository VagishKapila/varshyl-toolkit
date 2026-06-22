import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SorenConfig, SorenSession, SorenUser } from '../../types.js';

const storageKey = (productId: string) => `sorenSession_${productId}`;

function readSession(productId: string): SorenSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(productId));
    return raw ? (JSON.parse(raw) as SorenSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: SorenSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(session.productId), JSON.stringify(session));
}

export interface UseSorenSessionResult {
  session: SorenSession | null;
  user: SorenUser;
  identityComplete: boolean;
  greetingText: string;
  setTitle: (title: string) => void;
  setName: (name: string) => void;
  completeIdentity: () => void;
}

export function useSorenSession(config: SorenConfig, fallbackUserId = 'demo-user'): UseSorenSessionResult {
  const [session, setSession] = useState<SorenSession | null>(() => readSession(config.productId));

  const user = useMemo<SorenUser>(() => ({
    userId: session?.userId ?? fallbackUserId,
    firstName: session?.firstName ?? session?.name?.split(' ')[0] ?? 'there',
    title: session?.title,
    name: session?.name,
  }), [session, fallbackUserId]);

  const identityComplete = Boolean(session?.title && session?.name);

  const greetingText = useMemo(() => config.greeting(user), [config, user]);

  const persist = useCallback((next: SorenSession) => {
    writeSession(next);
    setSession(next);
  }, []);

  const setTitle = useCallback((title: string) => {
    const base: SorenSession = session ?? {
      userId: fallbackUserId,
      firstName: 'there',
      productId: config.productId,
    };
    persist({ ...base, title });
  }, [session, fallbackUserId, config.productId, persist]);

  const setName = useCallback((name: string) => {
    const firstName = name.trim().split(/\s+/)[0] || 'there';
    const base: SorenSession = session ?? {
      userId: fallbackUserId,
      firstName,
      productId: config.productId,
    };
    persist({ ...base, name, firstName });
  }, [session, fallbackUserId, config.productId, persist]);

  const completeIdentity = useCallback(() => {
    if (!session?.title || !session?.name) return;
    persist(session);
  }, [session, persist]);

  useEffect(() => {
    if (session) writeSession(session);
  }, [session]);

  return {
    session,
    user,
    identityComplete,
    greetingText,
    setTitle,
    setName,
    completeIdentity,
  };
}
