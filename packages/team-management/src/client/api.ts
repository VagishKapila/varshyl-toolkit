import type { ClientModuleConfig } from './types.js';

export function createApiClient(config: ClientModuleConfig) {
  const base = config.apiBasePath.replace(/\/$/, '');

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    health: () => get<{ status: string; module: string; db: string }>('/health'),
  };
}
