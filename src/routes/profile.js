
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/requireAuth');
const { supabase } = require('../lib/supabaseClient');

// In a real app, this would be an environment variable
const FEATURE_USER_ACCOUNTS = true;

if (FEATURE_USER_ACCOUNTS && supabase) {
  // User Profile
  router.get('/user', requireAuth, async (req, res) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, email_verified_at')
      .eq('id', req.user.id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.json(data);
  });

  // Order History
  router.get('/orders', requireAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('orders')
      .select('id, created_at, total, status')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  });

  // Address Book
  router.get('/addresses', requireAuth, async (req, res) => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  });

  router.post('/addresses', requireAuth, (req, res) => {
    res.status(501).json({ message: 'POST /addresses not implemented' });
  });

  router.put('/addresses/:id', requireAuth, (req, res) => {
    res.status(501).json({ message: 'PUT /addresses/:id not implemented' });
  });

  router.delete('/addresses/:id', requireAuth, (req, res) => {
    res.status(501).json({ message: 'DELETE /addresses/:id not implemented' });
  });

  // Change Password
  router.put('/user/password', requireAuth, (req, res) => {
    res.status(501).json({ message: 'PUT /user/password not implemented' });
  });
} else {
  if (FEATURE_USER_ACCOUNTS) {
    router.get('/(user|orders|addresses)', (req, res) => {
        res.status(503).json({ error: 'User accounts feature is enabled, but Supabase is not configured.' });
    });
  }
}

module.exports = router;
