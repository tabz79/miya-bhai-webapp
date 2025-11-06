// src/middleware/requireAuth.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * requireAuth middleware (Supabase token validation)
 *
 * This middleware protects routes by validating an access_token with Supabase.
 *
 * Behavior:
 * 1. Extracts the token from the `Authorization: Bearer <token>` header.
 * 2. If no token is found, it returns a 401 Unauthorized error.
 * 3. It creates a temporary Supabase client initialized with the provided token.
 * 4. It calls `supabase.auth.getUser()` to validate the token with the Supabase service.
 * 5. If the token is valid, Supabase returns the user, which is attached to `req.user`.
 * 6. If the token is invalid, expired, or the user doesn't exist, it returns a 401.
 */
export default async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Create a Supabase client scoped to the user's request token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Ask Supabase to validate the token and return the user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.warn('[requireAuth] Supabase getUser error:', error.message);
      return res.status(401).json({ error: `Unauthorized: ${error.message}` });
    }
    
    if (!user) {
      console.warn('[requireAuth] Supabase returned no user for the provided token.');
      return res.status(401).json({ error: 'Unauthorized: Invalid token or session' });
    }

    // Also fetch the user's profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[requireAuth] Supabase getProfile error:', profileError.message);
      // We don't want to fail the request if the profile is not found,
      // but we will log the error.
    }

    // Attach the validated user object and profile to the request
    req.user = { ...user, ...profile };

    console.log('[requireAuth] Authenticated via Supabase token:', { id: req.user.id, email: req.user.email, role: req.user.role });
    next();
  } catch (err) {
    console.error('[requireAuth] Unexpected error during token validation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}