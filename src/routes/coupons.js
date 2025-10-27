// src/routes/coupons.js
import 'dotenv/config'; // ensure env vars are loaded
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

// ---- Supabase (server-side) -------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_KEY?.trim() || // fallback if older name is used
  '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[coupons routes] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Endpoints will fail until these env vars are provided.'
  );
}

// Use service-role key on the backend (RLS bypass). NEVER expose this to client.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// GET /api/coupons (if mounted at /api) OR GET / (if mounted at /api/coupons)
// → PUBLIC: list coupons
// ---------------------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('[coupons GET] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /api/coupons  OR  POST /
// → ADMIN ONLY: create coupon
// ---------------------------------------------------------------------------
router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid coupon payload' });
    }

    const row = {
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('coupons').insert([row]).select();
    if (error) throw error;

    return res.status(201).json(data?.[0] ?? null);
  } catch (err) {
    console.error('[coupons POST] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/coupons/:id  OR  PUT /:id
// → ADMIN ONLY: update coupon
// ---------------------------------------------------------------------------
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id) return res.status(400).json({ error: 'Missing coupon ID' });
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { data, error } = await supabase
      .from('coupons')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Coupon not found' });

    return res.json(data[0]);
  } catch (err) {
    console.error('[coupons PUT] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/coupons/:id  OR  DELETE /:id
// → ADMIN ONLY: delete coupon
// ---------------------------------------------------------------------------
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing coupon ID' });

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;

    return res.status(204).send();
  } catch (err) {
    console.error('[coupons DELETE] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
