import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import documentsRouter from './routes/documents.js';
import generateRouter from './routes/generate.js';
import reviewRouter from './routes/review.js';
import billingRouter from './routes/billing.js';
import exportRouter from './routes/export.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));

// Stripe webhook endpoint must be raw body, so we need to add it before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/documents', documentsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/review', reviewRouter);
app.use('/api/billing', billingRouter);
app.use('/api/export', exportRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
