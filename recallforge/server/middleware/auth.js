import { createClient } from '@supabase/supabase-js';
import { pool } from '../db.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });

    // Supabase auth.users is separate from our own users table (credits, subscription tier, etc.) —
    // provision a matching row the first time this auth user hits the backend.
    await pool.query(
        `INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [data.user.id, data.user.email]
    );

    req.userId = data.user.id; // every route below can now use req.userId
    next();
}

