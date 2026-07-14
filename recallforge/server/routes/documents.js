// imports 
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post("/", requireAuth, async (req, res) => {
    const { rawText, courseName } = req.body;

    const result = await pool.query(
        "INSERT INTO documents (user_id, source_type, raw_text, course_name, status) VALUES ($1, 'text_paste', $2, $3, 'pending') RETURNING *",
        [req.userId, rawText, courseName,]
    );
    res.json(result.rows[0]);
});

// list all of the current users documents latest first
router.get('/', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.userId]
    );
    res.json(result.rows);
});

// Fetch one document, plus its study guide and flashcards if they exist
router.get('/:id', requireAuth, async (req, res) => {
    const doc = await pool.query(
        `SELECT * FROM documents WHERE id = $1 AND user_id = $2`, [req.params.id, req.userId]
    );

    const guide = await pool.query(`SELECT * FROM study_guides WHERE document_id = $1`,
[req.params.id]);

    const cards = await pool.query(`SELECT * FROM flashcards WHERE document_id = $1`,
[req.params.id]);

    res.json({ document: doc.rows[0], studyGuide: guide.rows[0], flashcards: cards.rows });
});

export default router;
