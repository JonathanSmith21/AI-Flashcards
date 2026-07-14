import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { scheduleNextReview } from '../services/scheduler.js';

const router = Router();

router.post('/:flashcardId', requireAuth, async (req, res) => {
  const { recalledCorrectly } = req.body;

  const result = await pool.query(`SELECT * FROM flashcards WHERE id = $1`, [req.params.flashcardId]);
  const updated = scheduleNextReview(result.rows[0], recalledCorrectly);

  await pool.query(
    `UPDATE flashcards SET interval_days = $1, ease_factor = $2, next_review_at = $3 WHERE id = $4`,
    [updated.interval_days, updated.ease_factor, updated.next_review_at, req.params.flashcardId]
  );

  await pool.query(
    `INSERT INTO review_history (flashcard_id, recalled_correctly) VALUES ($1, $2)`,
    [req.params.flashcardId, recalledCorrectly]
  );

  res.json({ success: true });
});

export default router;
