export type Platform = 'ios' | 'android' | 'web';

export function detectPlatform(): Platform {
  if (typeof globalThis !== 'undefined') {
    const win = globalThis as { __AS_PLATFORM__?: Platform };
    if (win.__AS_PLATFORM__) return win.__AS_PLATFORM__;
  }
  try {
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    const platform = cap?.getPlatform?.();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  } catch {
    // fall through to web
  }
  return 'web';
}

/** Test hook — override platform detection in smoke tests */
let platformOverride: Platform | null = null;

export function setPlatformOverride(platform: Platform | null): void {
  platformOverride = platform;
}

export function getPlatform(): Platform {
  return platformOverride ?? detectPlatform();
}
