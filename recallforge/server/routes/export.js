import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/anki/:documentId', requireAuth, async (req, res) => {
  const cards = await pool.query(
    `SELECT front, back FROM flashcards WHERE document_id = $1`, [req.params.documentId]
  );

  // Anki's simplest import format: one card per line, front and back separated by a tab
  const csv = cards.rows.map(c => `${c.front}\t${c.back}`).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="deck.csv"');
  res.send(csv);
});

export default router;
