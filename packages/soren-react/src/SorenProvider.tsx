import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  maybeMorningBriefing,
  type SorenAdapterConfig,
  type SorenVoiceSettings,
} from '@varshylinc/soren-core';
import { useSorenSession, type SorenSession } from './useSorenSession.js';

/** Everything exposed through {@link useSoren}. */
export interface SorenContextValue extends SorenSession {
  config: SorenAdapterConfig;
}

const SorenContext = createContext<SorenContextValue | null>(null);

export interface SorenProviderProps {
  config: SorenAdapterConfig;
  initialSettings?: Partial<SorenVoiceSettings>;
  /** Connect to the live engine on mount. Default true. */
  autoConnect?: boolean;
  /** Drives the morning briefing (FEAT 6). Briefing fires only when > 0. */
  activeProjectCount?: number;
  /** Optional name used in the morning greeting. */
  userFirstName?: string;
  children: ReactNode;
}

/**
 * Provides Soren voice state + controls to the tree. Owns the LiveKit room
 * lifecycle via {@link useSorenSession}; the STT/LLM/TTS pipeline runs in the
 * hosted engine. On mount, may speak a once-per-day morning briefing.
 */
export function SorenProvider({
  config,
  initialSettings,
  autoConnect = true,
  activeProjectCount = 0,
  userFirstName,
  children,
}: SorenProviderProps): ReactElement {
  const session = useSorenSession(config, initialSettings, autoConnect);
  const value = useMemo<SorenContextValue>(() => ({ ...session, config }), [session, config]);

  useEffect(() => {
    maybeMorningBriefing(activeProjectCount, userFirstName);
  }, [activeProjectCount, userFirstName]);

  return <SorenContext.Provider value={value}>{children}</SorenContext.Provider>;
}

/** Access Soren voice state + controls. Throws if used outside a SorenProvider. */
export function useSoren(): SorenContextValue {
  const ctx = useContext(SorenContext);
  if (ctx === null) throw new Error('useSoren must be used within a <SorenProvider>');
  return ctx;
}
