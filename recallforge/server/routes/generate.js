import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { checkAndDeductCredit } from '../middleware/checkCredits.js';
import { extractKeyConcepts, generateFlashcardsJSON } from '../services/aiPipeline.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const router = Router();

router.post('/study-guide/:documentId', requireAuth, checkAndDeductCredit, async (req, res) => {
  const doc = await pool.query(`SELECT * FROM documents WHERE id = $1`, [req.params.documentId]);
  const keyConcepts = await extractKeyConcepts(doc.rows[0].raw_text);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullText = '';
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: `Write a structured study guide from these
key concepts:\n${keyConcepts}` }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      fullText += event.delta.text;
      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
    }
  }

  await pool.query(
    `INSERT INTO study_guides (document_id, content_markdown, model) VALUES ($1, $2, $3)`,
    [req.params.documentId, fullText, 'claude-sonnet-4-6']
  );

  res.write('event: done\ndata: {}\n\n');
  res.end();
});

router.post('/flashcards/:documentId', requireAuth, checkAndDeductCredit, async (req, res) => {
  const doc = await pool.query(`SELECT * FROM documents WHERE id = $1`, [req.params.documentId]);
  const keyConcepts = await extractKeyConcepts(doc.rows[0].raw_text);
  const cards = await generateFlashcardsJSON(keyConcepts);

  for (const card of cards) {
    await pool.query(
      `INSERT INTO flashcards (document_id, front, back) VALUES ($1, $2, $3)`,
      [req.params.documentId, card.front, card.back]
    );
  }

  res.json({ cards });
});

export default router;
