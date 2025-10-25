import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. No user provided in request.' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile or profile not found:', error);
      return res.status(403).json({ error: 'Forbidden: User profile not found or error fetching profile.' });
    }

    if (data.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    next();
  } catch (err) {
    console.error('Unexpected error in requireAdmin middleware:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export default requireAdmin;
