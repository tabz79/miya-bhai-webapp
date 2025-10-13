// src/routes/user.js
import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { supabase } from '../lib/supabase.js'; // Use the admin client for sensitive ops

const router = Router();

const FEATURE_USER_ACCOUNTS = process.env.FEATURE_USER_ACCOUNTS === 'true';

/**
 * Dynamically load the ensureProfileExists helper.
 * This is a robust way to handle optional dependencies or different file locations.
 */
let ensureProfileExistsFn = null;
(async () => {
  try {
    const mod = await import('../lib/ensureProfileExists.js');
    ensureProfileExistsFn = mod.default || mod.ensureProfileExists;
    console.info('[user.js] Loaded ensureProfileExists helper.');
  } catch (e) {
    console.warn('[user.js] Could not load ensureProfileExists helper:', e.message);
  }
})();

if (FEATURE_USER_ACCOUNTS) {
  /**
   * GET /api/user
   * - Protected by requireAuth middleware.
   * - Trusts `req.user` to be populated with the authenticated user.
   * - Ensures a user profile exists and returns it.
   */
  router.get('/user', requireAuth, async (req, res) => {
    try {
      const { user } = req; // User is attached by requireAuth middleware
      const userId = user?.id;

      if (!userId) {
        // This should technically not be reached if requireAuth is working correctly
        console.warn('[api/user] Middleware passed but no user ID found.');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Use the admin Supabase client to ensure the profile exists, bypassing RLS if needed.
      if (!ensureProfileExistsFn) {
        console.error('[api/user] Fatal: ensureProfileExists helper is not available.');
        return res.status(500).json({ error: 'Server misconfiguration' });
      }

      const result = await ensureProfileExistsFn(supabase, userId, { email: user.email });

      if (!result.ok) {
        console.error('[api/user] Failed to ensure profile exists:', result.error);
        return res.status(500).json({ error: 'Failed to retrieve or create user profile' });
      }

      const profile = result.profile;

      // Return a consistent, clean user object
      res.json({
        id: userId,
        email: user.email,
        name: profile?.full_name || null,
        phone: profile?.phone || null,
        avatar_url: profile?.avatar_url || null,
      });
    } catch (err) {
      console.error('[api/user] Unexpected error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * PUT /api/user
   * - Updates the user's profile.
   * - Uses `req.user.id` for security.
   */
  router.put('/user', requireAuth, async (req, res) => {
    try {
      const { id: userId, email } = req.user;
      const { full_name, phone, avatar_url, branch } = req.body;

      const payload = {
        user_id: userId,
        full_name,
        phone,
        avatar_url,
        branch,
        email, // Ensure email is synced
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      res.json(data);
    } catch (err) {
      console.error('[PUT /api/user] Unexpected error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Other user-related routes (orders, addresses) can be simplified similarly
  // to trust `req.user` from the middleware.

  router.get('/user/orders', requireAuth, async (req, res) => {
    const { id: userId } = req.user;
    const limit = parseInt(req.query.limit || '10', 10);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(data);
  });
}

export default router;