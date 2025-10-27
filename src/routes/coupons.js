// src/routes/coupons.js
import 'dotenv/config'; // ✅ ensure env vars are loaded before creating the client
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ✅ robust env handling (supports either SERVICE_KEY or SERVICE_ROLE_KEY)
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[coupons routes] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Endpoints will fail until these env vars are provided.'
  );
}

// ✅ use service role key (backend only, full RLS bypass)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// GET /api/coupons → list all coupons
// ---------------------------------------------------------------------------
router.get('/coupons', async (req, res) => {
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
// POST /api/coupons → create new coupon
// ---------------------------------------------------------------------------
router.post('/coupons', async (req, res) => {
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

    return res.status(201).json(data[0]);
  } catch (err) {
    console.error('[coupons POST] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/coupons/:id → update coupon
// ---------------------------------------------------------------------------
router.put('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id) return res.status(400).json({ error: 'Missing coupon ID' });
    if (!payload || typeof payload !== 'object')
      return res.status(400).json({ error: 'Invalid payload' });

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
// DELETE /api/coupons/:id → delete coupon
// ---------------------------------------------------------------------------
router.delete('/coupons/:id', async (req, res) => {
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
