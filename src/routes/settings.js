import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[settings routes] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Endpoints will fail until these env vars are provided.');
}

// Service-role client (server-side)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Utility: try to safely parse JSON, returning original on failure
 */
function tryParseJson(value) {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Helper: read raw request body if express.json didn't populate req.body
 */
async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', (err) => reject(err));
  });
}

/**
 * Admin read: return all settings as a flat map
 * GET /api/admin/settings
 *
 * Returns: { key1: value1, key2: value2, ... }
 * If DB contains a single "settings" row with an object value, flatten it.
 */
router.get('/admin/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) throw error;

    // Build map
    const map = (data || []).reduce((acc, row) => {
      let v = row.value;
      if (typeof v === 'string') {
        try { v = JSON.parse(v); } catch (e) { /* leave as string */ }
      }
      acc[row.key] = v ?? {};
      return acc;
    }, {});

    // If the DB has a single "settings" row (older format), flatten it
    if (map.settings && typeof map.settings === 'object' && Object.keys(map).length === 1) {
      console.log('[admin/settings GET] flattening single "settings" row into top-level keys');
      const flat = { ...(map.settings || {}) };
      return res.json(flat);
    }

    // Also if both exist (keys + settings), prefer explicit keys but merge settings as fallback
    if (map.settings && typeof map.settings === 'object') {
      console.log('[admin/settings GET] merging "settings" row with explicit keys');
      const merged = { ...(map.settings || {}), ...map };
      delete merged.settings;
      return res.json(merged);
    }

    return res.json(map);
  } catch (err) {
    console.error('[admin/settings GET] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * Public read for delivery settings (keeps old behavior)
 * GET /api/settings/public
 */
router.get('/settings/public', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('key, value').eq('key', 'delivery');
    if (error) throw error;

    const settings = (data || []).reduce((acc, { key, value }) => {
      let v = value;
      if (typeof v === 'string') {
        try { v = JSON.parse(v); } catch {}
      }
      acc[key] = v;
      return acc;
    }, {});

    // If the single row is 'settings' with nested delivery, try to use it
    if (settings.settings && settings.settings.delivery) {
      return res.json({ delivery: settings.settings.delivery });
    }

    return res.json(settings);
  } catch (err) {
    console.error('[settings/public] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * Admin: upsert settings map
 * PUT /api/admin/settings
 *
 * Expects body: { business_info: {...}, orders: {...}, payments: {...}, delivery: {...}, ... }
 * It will upsert rows into `settings` table with key/value pairs.
 *
 * NOTE: This handler includes extra logging and raw-body fallback to help debug client/server payload issues.
 * It also unwraps a top-level "settings" key if present.
 */
router.put('/admin/settings', async (req, res) => {
  try {
    try {
      console.log('[admin/settings] headers:', JSON.stringify(req.headers, null, 2));
    } catch (e) { /* ignore */ }
    console.log('[admin/settings] req.body present?', !!req.body, 'typeof:', typeof req.body);

    let payload = req.body;

    // If no parsed body, attempt to read raw data and parse it
    if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
      try {
        const raw = await readRawBody(req);
        console.log('[admin/settings] raw body length:', raw ? raw.length : 0);
        if (raw) {
          const parsed = tryParseJson(raw);
          if (parsed && typeof parsed === 'object') {
            payload = parsed;
            console.log('[admin/settings] parsed raw body into object (preview):', JSON.stringify(payload).slice(0, 1000));
          } else {
            console.log('[admin/settings] raw body could not be parsed as JSON; content preview:', raw.slice(0, 1000));
          }
        } else {
          console.log('[admin/settings] raw body empty');
        }
      } catch (e) {
        console.warn('[admin/settings] failed to read raw body:', e);
      }
    } else {
      try { console.log('[admin/settings] body preview:', JSON.stringify(payload).slice(0, 1000)); } catch {}
    }

    payload = payload || {};

    if (!payload || Object.keys(payload).length === 0) {
      console.warn('[admin/settings] no payload received; rejecting with 400');
      return res.status(400).json({ error: 'No settings provided (empty request body).' });
    }

    // If payload is wrapped as { settings: { ... } }, unwrap it
    if (payload.settings && typeof payload.settings === 'object' && Object.keys(payload).length === 1) {
      console.log('[admin/settings] unwrapping top-level "settings" key from payload');
      payload = payload.settings;
    }

    // Convert to rows for upsert
    const rows = Object.keys(payload).map((key) => {
      const rawVal = payload[key];
      const value = tryParseJson(rawVal);
      return {
        key,
        value,
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('[admin/settings] supabase upsert error', error);
      return res.status(500).json({ error: error.message || String(error) });
    }

    console.log('[admin/settings] upsert completed. rows:', rows.map(r=>r.key).join(', '));
    return res.json({ success: true, updated: data?.length ?? rows.length });
  } catch (err) {
    console.error('[admin/settings] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
