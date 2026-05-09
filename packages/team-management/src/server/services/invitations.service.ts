import type { Pool } from 'pg';
import type { TmInvitation, OrgRole, ServerModuleAdapter } from '../types.js';
import { encrypt, decrypt, generateToken, generateSixDigitCode, sha256 } from '../crypto.js';

const INVITATION_EXPIRY_HOURS = 72;

export async function createInvitation(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    orgId,
    invitedByUserId,
    email,
    role,
    baseUrl,
  }: { orgId: number; invitedByUserId: number; email: string; role: OrgRole; baseUrl: string }
): Promise<{ invitation: TmInvitation; token: string; code: string }> {
  // Check if there's already a pending invite for this email+org
  const existing = await pool.query(
    `SELECT id FROM tm_invitations
     WHERE org_id = $1 AND email = $2 AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at > NOW()`,
    [orgId, email]
  );
  if (existing.rows.length > 0) {
    throw new Error('A pending invitation already exists for this email address');
  }

  const token = generateToken(32);
  const code = generateSixDigitCode();
  const tokenHash = sha256(token);
  const codeEncrypted = encrypt(code);

  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  const result = await pool.query<TmInvitation>(
    `INSERT INTO tm_invitations
       (org_id, invited_by_user_id, email, role, token_hash, code_encrypted, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [orgId, invitedByUserId, email, role, tokenHash, codeEncrypted, expiresAt]
  );

  const invitation = result.rows[0];

  // Fetch org and inviter info for the email
  const orgResult = await pool.query(`SELECT name FROM tm_organizations WHERE id = $1`, [orgId]);
  const inviterUser = await adapter.getUserById(invitedByUserId);
  const orgName = orgResult.rows[0]?.name ?? 'Unknown Organization';
  const inviterName = inviterUser?.name ?? inviterUser?.email ?? 'A team member';

  const magicLinkUrl = `${baseUrl}/join?token=${token}`;

  try {
    await adapter.sendInviteEmail({
      to: email,
      orgName,
      inviterName,
      role,
      magicLinkUrl,
      code,
    });
  } catch (e) {
    // Log but don't fail — invitation is created, email failure is non-fatal
    adapter.logger.warn('[invitations] Failed to send invite email', {
      invitationId: invitation.id,
      error: (e as Error).message,
    });
  }

  return { invitation, token, code };
}

export async function acceptInvitationByToken(
  pool: Pool,
  adapter: ServerModuleAdapter,
  { token, acceptingUserId }: { token: string; acceptingUserId?: number }
): Promise<{ orgId: number; role: OrgRole }> {
  const tokenHash = sha256(token);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query<TmInvitation>(
      `SELECT * FROM tm_invitations
       WHERE token_hash = $1 AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      throw new Error('Invitation not found, expired, or already used');
    }

    const invitation = result.rows[0];
    let userId = acceptingUserId;

    if (!userId) {
      // Try to find existing user by email, or create from invite
      const existingUser = await adapter.findUserByEmail(invitation.email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await adapter.createUserFromInvite({
          email: invitation.email,
          orgId: invitation.org_id,
          role: invitation.role,
        });
        userId = newUser.id;
      }
    }

    // Check if user is already in the org (sub-A: org switch)
    const existingMembership = await client.query(
      `SELECT id, role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [invitation.org_id, userId]
    );

    if (existingMembership.rows.length > 0) {
      // Already a member — mark invite accepted and return
      await client.query(
        `UPDATE tm_invitations SET accepted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [invitation.id]
      );
      await client.query('COMMIT');
      return { orgId: invitation.org_id, role: existingMembership.rows[0].role };
    }

    // Add member to org
    await client.query(
      `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (org_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, removed_at = NULL, removed_by_user_id = NULL,
                     removal_reason = NULL, updated_at = NOW()`,
      [invitation.org_id, userId, invitation.role]
    );

    // Mark invitation as accepted
    await client.query(
      `UPDATE tm_invitations SET accepted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [invitation.id]
    );

    await client.query('COMMIT');
    return { orgId: invitation.org_id, role: invitation.role };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function acceptInvitationByCode(
  pool: Pool,
  adapter: ServerModuleAdapter,
  { email, code, acceptingUserId }: { email: string; code: string; acceptingUserId?: number }
): Promise<{ orgId: number; role: OrgRole }> {
  // Find active invitations for this email
  const result = await pool.query<TmInvitation>(
    `SELECT * FROM tm_invitations
     WHERE email = $1 AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 10`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('No valid invitation found for this email address');
  }

  // Find the one with matching code
  let matchedInvitation: TmInvitation | null = null;
  for (const inv of result.rows) {
    try {
      const decryptedCode = decrypt(inv.code_encrypted);
      if (decryptedCode === code) {
        matchedInvitation = inv;
        break;
      }
    } catch {
      // Skip invitations with corrupted codes
    }
  }

  if (!matchedInvitation) {
    throw new Error('Invalid invitation code');
  }

  // Delegate to token-based accept with the matched invitation
  const token = generateToken(32);

  // Temporarily update token so we can use acceptInvitationByToken logic
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let userId = acceptingUserId;
    if (!userId) {
      const existingUser = await adapter.findUserByEmail(email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await adapter.createUserFromInvite({
          email,
          orgId: matchedInvitation.org_id,
          role: matchedInvitation.role,
        });
        userId = newUser.id;
      }
    }

    await client.query(
      `INSERT INTO tm_memberships (org_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (org_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, removed_at = NULL, removed_by_user_id = NULL,
                     removal_reason = NULL, updated_at = NOW()`,
      [matchedInvitation.org_id, userId, matchedInvitation.role]
    );

    await client.query(
      `UPDATE tm_invitations SET accepted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [matchedInvitation.id]
    );

    await client.query('COMMIT');
    return { orgId: matchedInvitation.org_id, role: matchedInvitation.role };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function revokeInvitation(
  pool: Pool,
  { invitationId, revokedByUserId }: { invitationId: number; revokedByUserId: number }
): Promise<void> {
  const result = await pool.query(
    `UPDATE tm_invitations
     SET revoked_at = NOW(), revoked_by_user_id = $1, updated_at = NOW()
     WHERE id = $2 AND revoked_at IS NULL AND accepted_at IS NULL`,
    [revokedByUserId, invitationId]
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error('Invitation not found, already accepted, or already revoked');
  }
}

export async function resendInvitation(
  pool: Pool,
  adapter: ServerModuleAdapter,
  { invitationId, baseUrl }: { invitationId: number; baseUrl: string }
): Promise<void> {
  const result = await pool.query<TmInvitation>(
    `SELECT * FROM tm_invitations WHERE id = $1 AND revoked_at IS NULL AND accepted_at IS NULL`,
    [invitationId]
  );
  if (result.rows.length === 0) {
    throw new Error('Invitation not found, accepted, or revoked');
  }

  const invitation = result.rows[0];
  const newToken = generateToken(32);
  const newCode = generateSixDigitCode();
  const newTokenHash = sha256(newToken);
  const newCodeEncrypted = encrypt(newCode);
  const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  await pool.query(
    `UPDATE tm_invitations
     SET token_hash = $1, code_encrypted = $2, expires_at = $3,
         resent_count = resent_count + 1, updated_at = NOW()
     WHERE id = $4`,
    [newTokenHash, newCodeEncrypted, newExpiresAt, invitationId]
  );

  const orgResult = await pool.query(`SELECT name FROM tm_organizations WHERE id = $1`, [invitation.org_id]);
  const inviterUser = await adapter.getUserById(invitation.invited_by_user_id);
  const orgName = orgResult.rows[0]?.name ?? 'Unknown Organization';
  const inviterName = inviterUser?.name ?? inviterUser?.email ?? 'A team member';
  const magicLinkUrl = `${baseUrl}/join?token=${newToken}`;

  await adapter.sendInviteEmail({
    to: invitation.email,
    orgName,
    inviterName,
    role: invitation.role,
    magicLinkUrl,
    code: newCode,
  });
}

export async function listPendingInvitations(pool: Pool, orgId: number): Promise<TmInvitation[]> {
  const result = await pool.query<TmInvitation>(
    `SELECT * FROM tm_invitations
     WHERE org_id = $1 AND revoked_at IS NULL AND accepted_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [orgId]
  );
  return result.rows;
}

export async function getInvitationWithDecryptedCode(
  pool: Pool,
  invitationId: number
): Promise<TmInvitation & { code: string }> {
  const result = await pool.query<TmInvitation>(
    `SELECT * FROM tm_invitations WHERE id = $1`,
    [invitationId]
  );
  if (result.rows.length === 0) throw new Error('Invitation not found');
  const inv = result.rows[0];
  const code = decrypt(inv.code_encrypted);
  return { ...inv, code };
}

