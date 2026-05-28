import { handleAuthFetch } from './authMock.js';
import { handleTeamFetch } from './teamMock.js';

function matchApiPath(url: string, prefix: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin);
    if (!parsed.pathname.startsWith(prefix)) return null;
    return parsed.pathname.slice(prefix.length) || '/';
  } catch {
    return null;
  }
}

export function installMockFetch(): void {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    const authPath = matchApiPath(url, '/api/auth');
    if (authPath) {
      const res = handleAuthFetch(authPath, init);
      if (res) return res;
    }

    const teamPath = matchApiPath(url, '/api/team');
    if (teamPath) {
      const res = handleTeamFetch(teamPath, init);
      if (res) return res;
    }

    return nativeFetch(input, init);
  };
}
