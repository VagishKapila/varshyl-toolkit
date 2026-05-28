interface MockUser {
  id: string;
  email: string;
  name?: string;
  password: string;
}

interface SessionEntry {
  userId: string;
  email: string;
  expiresAt: string;
}

const users = new Map<string, MockUser>();
const sessions = new Map<string, SessionEntry>();
const resetTokens = new Map<string, { userId: string; email: string }>();
let nextId = 1;
let lastResetToken: string | null = null;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseMockProvider(idToken: string): { subject: string; email: string } | null {
  const parts = idToken.split(':');
  if (parts[0] !== 'mock' || parts.length < 4) return null;
  return { subject: parts[2], email: parts[3] };
}

function issueSession(user: MockUser): { token: string; userId: string; expiresAt: string } {
  const token = `demo-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  sessions.set(token, { userId: user.id, email: user.email, expiresAt });
  return { token, userId: user.id, expiresAt };
}

function findUserByEmail(email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase();
  return [...users.values()].find((u) => u.email === normalized);
}

function upsertUser(email: string, password: string, name?: string): MockUser {
  const existing = findUserByEmail(email);
  if (existing) {
    existing.password = password;
    if (name) existing.name = name;
    return existing;
  }
  const user: MockUser = {
    id: String(nextId++),
    email: email.trim().toLowerCase(),
    name,
    password,
  };
  users.set(user.id, user);
  return user;
}

export function getLastResetToken(): string | null {
  return lastResetToken;
}

export function handleAuthFetch(path: string, init?: RequestInit): Response | null {
  const method = init?.method ?? 'GET';
  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  if (method === 'POST' && path.endsWith('/signup')) {
    const email = String(body.email ?? '');
    const password = String(body.password ?? '');
    const name = body.name ? String(body.name) : undefined;
    if (findUserByEmail(email)) return json({ error: 'Email already registered' }, 400);
    const session = issueSession(upsertUser(email, password, name));
    return json(session);
  }

  if (method === 'POST' && path.endsWith('/signin') && !path.includes('/provider')) {
    const user = findUserByEmail(String(body.email ?? ''));
    if (!user || user.password !== String(body.password ?? '')) {
      return json({ error: 'Invalid email or password' }, 401);
    }
    return json(issueSession(user));
  }

  if (method === 'POST' && path.endsWith('/signin/provider')) {
    const parsed = parseMockProvider(String(body.idToken ?? ''));
    if (!parsed) return json({ error: 'Mock provider requires mock:idToken format' }, 400);
    const user = upsertUser(parsed.email, 'oauth-demo', parsed.subject);
    return json(issueSession(user));
  }

  if (method === 'POST' && path.endsWith('/password-reset/request')) {
    const user = findUserByEmail(String(body.email ?? ''));
    if (user) {
      const token = `reset-${crypto.randomUUID()}`;
      resetTokens.set(token, { userId: user.id, email: user.email });
      lastResetToken = token;
    }
    return json({ ok: true });
  }

  if (method === 'POST' && path.endsWith('/password-reset/confirm')) {
    const token = String(body.token ?? '');
    const entry = resetTokens.get(token);
    if (!entry) return json({ error: 'Invalid or expired reset token' }, 400);
    const user = users.get(entry.userId);
    if (!user) return json({ error: 'User not found' }, 404);
    user.password = String(body.newPassword ?? '');
    resetTokens.delete(token);
    return json({ ok: true });
  }

  if (method === 'POST' && path.endsWith('/signout')) {
    sessions.delete(String(body.token ?? ''));
    return json({ ok: true });
  }

  if (method === 'GET' && path.endsWith('/session')) {
    const auth = init?.headers instanceof Headers ? init.headers.get('Authorization') : null;
    const token = auth?.replace(/^Bearer\s+/, '') ?? '';
    const session = sessions.get(token);
    if (!session) return json({ error: 'Unauthorized' }, 401);
    return json({ userId: session.userId, email: session.email });
  }

  return null;
}
