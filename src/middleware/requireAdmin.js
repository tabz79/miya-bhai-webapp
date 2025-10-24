import { supabase } from '../lib/supabaseClient.js';

const requireAdmin = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      console.warn(`Access denied for user ${req.user.id}. Role: ${profile?.role}`);
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    next();
  } catch (err) {
    console.error('[requireAdmin] Error fetching user role:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

export default requireAdmin;
