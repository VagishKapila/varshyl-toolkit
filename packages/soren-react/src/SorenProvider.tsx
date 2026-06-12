import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { SorenAdapterConfig, SorenVoiceSettings } from '@varshylinc/soren-core';
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
  children: ReactNode;
}

/**
 * Provides Soren voice state + controls to the tree. Owns the LiveKit room
 * lifecycle via {@link useSorenSession}; the STT/LLM/TTS pipeline runs in the
 * hosted engine.
 */
export function SorenProvider({
  config,
  initialSettings,
  autoConnect = true,
  children,
}: SorenProviderProps): ReactElement {
  const session = useSorenSession(config, initialSettings, autoConnect);
  const value = useMemo<SorenContextValue>(() => ({ ...session, config }), [session, config]);
  return <SorenContext.Provider value={value}>{children}</SorenContext.Provider>;
}

/** Access Soren voice state + controls. Throws if used outside a SorenProvider. */
export function useSoren(): SorenContextValue {
  const ctx = useContext(SorenContext);
  if (ctx === null) throw new Error('useSoren must be used within a <SorenProvider>');
  return ctx;
}
