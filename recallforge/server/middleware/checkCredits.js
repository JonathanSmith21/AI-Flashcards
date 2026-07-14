import { pool } from '../db.js';

export async function checkAndDeductCredit(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT credits_remaining FROM users WHERE id = $1 FOR UPDATE`, [req.userId]
    );

    if (result.rows[0].credits_remaining < 1) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'Out of credits' });
    }

    await client.query(
      `UPDATE users SET credits_remaining = credits_remaining - 1 WHERE id = $1`, [req.userId]
    );

    await client.query(
      `INSERT INTO credit_transactions (user_id, amount, reason) VALUES ($1, -1, 'generation')`,
      [req.userId]
    );

    await client.query('COMMIT');
    next(); // credit check passed — let the route continue
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Credit check failed' });
  } finally {
    client.release();
  }
}
