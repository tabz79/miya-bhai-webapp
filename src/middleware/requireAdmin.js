import { supabase } from '../lib/supabase.js';

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      // If the user has an auth entry but no profile, treat as non-admin
      if (error.code === 'PGRST116') {
        return res.status(403).json({ message: 'Forbidden: Access denied.' });
      }
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (data && data.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }
  } catch (err) {
    console.error('Exception in requireAdmin middleware:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export default requireAdmin;
