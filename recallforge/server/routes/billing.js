import { Router } from 'express';
import Stripe from 'stripe';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { priceId } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/billing/success`,
    cancel_url: `${process.env.CLIENT_URL}/billing`,
    client_reference_id: req.userId,
  });

  res.json({ url: session.url });
});

// Stripe calls this URL directly when a real payment event happens
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await pool.query(
      `UPDATE users SET subscription_tier = 'student', credits_remaining = 20 WHERE id = $1`,
      [session.client_reference_id]
    );
  }

  res.json({ received: true });
});

router.post('/portal', requireAuth, async (req, res) => {
  const user = await pool.query(`SELECT stripe_customer_id FROM users WHERE id = $1`, [req.userId]);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.rows[0].stripe_customer_id,
    return_url: process.env.CLIENT_URL,
  });

  res.json({ url: session.url });
});

export default router;
