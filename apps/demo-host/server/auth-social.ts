import { Router, type Request } from 'express';
import type { AuthService } from '@varshylinc/auth-social';
import type { MockAuthCapture } from '@varshylinc/auth-social';

function parseBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function sessionCookie(token: string, maxAgeMs: number): string {
  return `as_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeMs / 1000)}`;
}

export function createAuthRouter(
  service: AuthService,
  capture?: MockAuthCapture
): Router {
  const router = Router();

  router.post('/signup', async (req, res) => {
    try {
      const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
      if (!email || !password) {
        res.status(400).json({ error: 'email and password required' });
        return;
      }
      const session = await service.signUpEmail({ email, password, name });
      res.setHeader('Set-Cookie', sessionCookie(session.token, session.expiresAt.getTime() - Date.now()));
      res.json(session);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.post('/signin', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        res.status(400).json({ error: 'email and password required' });
        return;
      }
      const session = await service.signInEmail({ email, password });
      res.setHeader('Set-Cookie', sessionCookie(session.token, session.expiresAt.getTime() - Date.now()));
      res.json(session);
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  });

  router.post('/signin/provider', async (req, res) => {
    try {
      const { provider, idToken } = req.body as { provider?: 'apple' | 'google'; idToken?: string };
      if (!provider || !idToken) {
        res.status(400).json({ error: 'provider and idToken required' });
        return;
      }
      const session = await service.signInWithProvider({ provider, idToken });
      res.setHeader('Set-Cookie', sessionCookie(session.token, session.expiresAt.getTime() - Date.now()));
      res.json(session);
    } catch (e) {
      res.status(401).json({ error: (e as Error).message });
    }
  });

  router.post('/password-reset/request', async (req, res) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        res.status(400).json({ error: 'email required' });
        return;
      }
      await service.requestPasswordReset(email);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.post('/password-reset/confirm', async (req, res) => {
    try {
      const { token, newPassword } = req.body as { token?: string; newPassword?: string };
      if (!token || !newPassword) {
        res.status(400).json({ error: 'token and newPassword required' });
        return;
      }
      await service.resetPassword({ token, newPassword });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });

  router.get('/session', async (req, res) => {
    const token = parseBearer(req) ?? parseCookie(req, 'as_session');
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const session = await service.verifySession(token);
    if (!session) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    res.json({ userId: session.userId, email: `${session.userId}@demo.local` });
  });

  router.post('/signout', async (req, res) => {
    const token = (req.body as { token?: string }).token ?? parseCookie(req, 'as_session');
    if (token) await service.revokeSession(token);
    res.setHeader('Set-Cookie', 'as_session=; Path=/; HttpOnly; Max-Age=0');
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV === 'test' && capture) {
    router.get('/test/capture', (_req, res) => {
      res.json({
        lastResetToken: capture.lastResetToken,
        lastResetEmail: capture.lastResetEmail,
      });
    });
  }

  return router;
}

function parseCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie ?? '';
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(raw);
  return m ? decodeURIComponent(m[1]) : null;
}
