import type { Pool } from 'pg';
import type { TmOwnershipTransfer, ServerModuleAdapter } from '../types.js';

const TRANSFER_EXPIRY_HOURS = 48;

export async function initiateTransfer(
  pool: Pool,
  adapter: ServerModuleAdapter,
  {
    orgId,
    fromUserId,
    toUserId,
    baseUrl,
  }: { orgId: number; fromUserId: number; toUserId: number; baseUrl: string }
): Promise<TmOwnershipTransfer> {
  // Validate target is an active admin (not owner)
  const targetMembership = await pool.query(
    `SELECT role FROM tm_memberships WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [orgId, toUserId]
  );
  if (targetMembership.rows.length === 0) {
    throw new Error('Target user is not a member of this organization');
  }
  if (targetMembership.rows[0].role !== 'admin') {
    throw new Error('Ownership can only be transferred to an admin member');
  }

  // Check no pending transfer exists
  const pending = await pool.query(
    `SELECT id FROM tm_ownership_transfers
     WHERE org_id = $1 AND status = 'pending' AND expires_at > NOW()`,
    [orgId]
  );
  if (pending.rows.length > 0) {
    throw new Error('A pending ownership transfer already exists for this organization');
  }

  const expiresAt = new Date(Date.now() + TRANSFER_EXPIRY_HOURS * 60 * 60 * 1000);

  const result = await pool.query<TmOwnershipTransfer>(
    `INSERT INTO tm_ownership_transfers (org_id, from_user_id, to_user_id, status, expires_at)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING *`,
    [orgId, fromUserId, toUserId, expiresAt]
  );

  const transfer = result.rows[0];

  // Send email to target user
  const orgResult = await pool.query(`SELECT name FROM tm_organizations WHERE id = $1`, [orgId]);
  const fromUser = await adapter.getUserById(fromUserId);
  const toUser = await adapter.getUserById(toUserId);
  const orgName = orgResult.rows[0]?.name ?? 'Unknown Organization';
  const fromName = fromUser?.name ?? fromUser?.email ?? 'The current owner';

  if (toUser?.email) {
    try {
      await adapter.sendOwnershipTransferEmail({
        to: toUser.email,
        orgName,
        fromName,
        transferUrl: `${baseUrl}/orgs/${orgId}/transfer/accept`,
      });
    } catch (e) {
      adapter.logger.warn('[ownership] Failed to send transfer email', {
        transferId: transfer.id,
        error: (e as Error).message,
      });
    }
  }

  return transfer;
}

export async function acceptTransfer(
  pool: Pool,
  adapter: ServerModuleAdapter,
  { orgId, acceptingUserId }: { orgId: number; acceptingUserId: number }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transferResult = await client.query<TmOwnershipTransfer>(
      `SELECT * FROM tm_ownership_transfers
       WHERE org_id = $1 AND status = 'pending' AND expires_at > NOW()
       FOR UPDATE`,
      [orgId]
    );
    if (transferResult.rows.length === 0) {
      throw new Error('No valid pending transfer found for this organization');
    }

    const transfer = transferResult.rows[0];
    if (transfer.to_user_id !== acceptingUserId) {
      throw new Error('Only the designated recipient can accept this transfer');
    }

    // Atomic: new owner gets owner role, old owner gets admin role
    await client.query(
      `UPDATE tm_memberships SET role = 'owner', updated_at = NOW()
       WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [orgId, transfer.to_user_id]
    );
    await client.query(
      `UPDATE tm_memberships SET role = 'admin', updated_at = NOW()
       WHERE org_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [orgId, transfer.from_user_id]
    );

    // Update denormalized owner_user_id on org
    await client.query(
      `UPDATE tm_organizations SET owner_user_id = $1, updated_at = NOW() WHERE id = $2`,
      [transfer.to_user_id, orgId]
    );

    // Mark transfer as accepted
    await client.query(
      `UPDATE tm_ownership_transfers
       SET status = 'completed', accepted_at = NOW()
       WHERE id = $1`,
      [transfer.id]
    );

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function cancelTransfer(
  pool: Pool,
  { orgId, cancelledByUserId }: { orgId: number; cancelledByUserId: number }
): Promise<void> {
  const result = await pool.query(
    `UPDATE tm_ownership_transfers
     SET status = 'cancelled', cancelled_at = NOW(), cancelled_by_user_id = $1
     WHERE org_id = $2 AND status = 'pending'`,
    [cancelledByUserId, orgId]
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error('No pending transfer found to cancel');
  }
}

export async function getPendingTransfer(
  pool: Pool,
  orgId: number
): Promise<TmOwnershipTransfer | null> {
  const result = await pool.query<TmOwnershipTransfer>(
    `SELECT * FROM tm_ownership_transfers
     WHERE org_id = $1 AND status = 'pending' AND expires_at > NOW()
     ORDER BY initiated_at DESC
     LIMIT 1`,
    [orgId]
  );
  return result.rows[0] ?? null;
}

export async function expireTransfers(pool: Pool): Promise<number> {
  const result = await pool.query(
    `UPDATE tm_ownership_transfers
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at <= NOW()`
  );
  return result.rowCount ?? 0;
}
