import type { OrgRole } from '@varshylinc/team-management/client';

const DEMO_ORG_ID = 1;
const joinedAt = '2026-01-15T10:00:00.000Z';

interface StoredMember {
  id: number;
  user_id: number;
  org_id: number;
  role: OrgRole;
  email: string;
  name: string;
  joined_at: string;
}

let nextMemberId = 5;
let nextUserId = 6;

const members: StoredMember[] = [
  { id: 1, user_id: 1, org_id: DEMO_ORG_ID, role: 'owner', email: 'sarah@demo.varshyl.com', name: 'Sarah Chen', joined_at: joinedAt },
  { id: 2, user_id: 2, org_id: DEMO_ORG_ID, role: 'admin', email: 'mike@demo.varshyl.com', name: 'Mike Torres', joined_at: joinedAt },
  { id: 3, user_id: 3, org_id: DEMO_ORG_ID, role: 'member', email: 'jane@demo.varshyl.com', name: 'Jane Williams', joined_at: joinedAt },
  { id: 4, user_id: 4, org_id: DEMO_ORG_ID, role: 'viewer', email: 'tom@demo.varshyl.com', name: 'Tom Nakamura', joined_at: joinedAt },
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toRaw(member: StoredMember) {
  return {
    id: member.id,
    org_id: member.org_id,
    user_id: member.user_id,
    role: member.role,
    joined_at: member.joined_at,
    user: { id: member.user_id, email: member.email, name: member.name },
  };
}

function hierarchy() {
  const roles: OrgRole[] = ['owner', 'admin', 'member', 'viewer'];
  return {
    hierarchy: roles
      .map((role) => ({
        role,
        members: members.filter((m) => m.role === role).map((m) => ({
          membership: toRaw(m),
          email: m.email,
          name: m.name,
        })),
      }))
      .filter((g) => g.members.length > 0),
  };
}

export function handleTeamFetch(path: string, init?: RequestInit): Response | null {
  const method = init?.method ?? 'GET';
  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  if (method === 'GET' && path.endsWith('/me/membership')) {
    return json({
      org: {
        id: DEMO_ORG_ID,
        name: 'Demo Construction Co.',
        slug: 'demo-construction-co',
        settings: {},
        created_at: joinedAt,
      },
      user_id: 1,
      role: 'owner',
      joined_at: joinedAt,
    });
  }

  const membersMatch = /\/orgs\/(\d+)\/members$/.exec(path);
  if (membersMatch && method === 'GET') {
    return json({ members: members.map(toRaw) });
  }

  if (membersMatch && method === 'POST') {
    const email = String(body.email ?? '');
    const role = String(body.role ?? 'member') as OrgRole;
    const name = body.name ? String(body.name) : email.split('@')[0];
    const created: StoredMember = {
      id: nextMemberId++,
      user_id: nextUserId++,
      org_id: Number(membersMatch[1]),
      role,
      email,
      name,
      joined_at: new Date().toISOString(),
    };
    members.push(created);
    return json({ member: { membership: toRaw(created), email, name } }, 201);
  }

  const memberMatch = /\/orgs\/(\d+)\/members\/(\d+)$/.exec(path);
  if (memberMatch && method === 'PATCH') {
    const userId = Number(memberMatch[2]);
    const member = members.find((m) => m.user_id === userId);
    if (!member) return json({ error: 'Member not found' }, 404);
    if (body.role) member.role = String(body.role) as OrgRole;
    if (body.name) member.name = String(body.name);
    return json({ member: { membership: toRaw(member), email: member.email, name: member.name } });
  }

  if (memberMatch && method === 'DELETE') {
    const userId = Number(memberMatch[2]);
    const idx = members.findIndex((m) => m.user_id === userId);
    if (idx === -1) return new Response(null, { status: 204 });
    members.splice(idx, 1);
    return new Response(null, { status: 204 });
  }

  const hierarchyMatch = /\/orgs\/(\d+)\/hierarchy$/.exec(path);
  if (hierarchyMatch && method === 'GET') {
    return json(hierarchy());
  }

  return null;
}
