import type { Pool, PoolClient } from 'pg';

export async function getCreditBalance(
  pool: Pool,
  email: string,
): Promise<number> {
  const result = await pool.query<{ balance: number }>(
    'SELECT balance FROM sc_credit_accounts WHERE email = $1',
    [email],
  );
  return result.rows[0]?.balance ?? 0;
}

export async function addCredits(
  pool: Pool,
  email: string,
  credits: number,
  stripeSessionId: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const account = await client.query<{ id: string }>(
      `INSERT INTO sc_credit_accounts (email, balance)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE
         SET balance = sc_credit_accounts.balance + EXCLUDED.balance,
             updated_at = NOW()
       RETURNING id`,
      [email, credits],
    );

    const accountId = account.rows[0].id;

    await client.query(
      `INSERT INTO sc_credit_transactions
         (account_id, amount, type, description, stripe_session_id)
       VALUES ($1, $2, 'purchase', $3, $4)`,
      [
        accountId,
        credits,
        `Purchased ${credits} Soren Credits`,
        stripeSessionId,
      ],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deductCredits(
  pool: Pool,
  email: string,
  amount: number,
  description: string,
): Promise<{ success: boolean; balance: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const account = await client.query<{ id: string; balance: number }>(
      'SELECT id, balance FROM sc_credit_accounts WHERE email = $1 FOR UPDATE',
      [email],
    );

    if (account.rows.length === 0 || account.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return {
        success: false,
        balance: account.rows[0]?.balance ?? 0,
      };
    }

    const accountId = account.rows[0].id;
    const newBalance = account.rows[0].balance - amount;

    await client.query(
      `UPDATE sc_credit_accounts
       SET balance = $1, updated_at = NOW()
       WHERE id = $2`,
      [newBalance, accountId],
    );

    await client.query(
      `INSERT INTO sc_credit_transactions
         (account_id, amount, type, description)
       VALUES ($1, $2, 'deduct', $3)`,
      [accountId, -amount, description],
    );

    await client.query('COMMIT');
    return { success: true, balance: newBalance };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function hasProcessedSession(
  client: PoolClient,
  stripeSessionId: string,
): Promise<boolean> {
  const result = await client.query(
    `SELECT id FROM sc_credit_transactions
     WHERE stripe_session_id = $1
     LIMIT 1`,
    [stripeSessionId],
  );
  return result.rows.length > 0;
}
