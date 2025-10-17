// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// --- Universal env resolver (works in both Vite + Node) ---
const getEnv = () => {
  // Server-side (Node)
  if (typeof process !== 'undefined' && process.env) {
    return {
      SUPABASE_URL:
        (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim(),
      SUPABASE_ANON_KEY:
        (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    };
  }

  // Browser / Vite build
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
      SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
    };
  }

  return { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
};

const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

// === Safe diagnostic logging: only in browser to avoid leaking secrets in server logs ===
if (typeof window !== 'undefined') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Friendly error that doesn't print values
    // eslint-disable-next-line no-console
    console.error('[supabase] ❌ Missing env vars:', {
      VITE_SUPABASE_URL: !!SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
    });
  } else {
    // Redacted log for troubleshooting in the browser
    // eslint-disable-next-line no-console
    console.log('[supabase] ✅ Env vars loaded:', SUPABASE_URL, SUPABASE_ANON_KEY.slice(0, 10) + '…');
  }
}

// === create supabase client ===
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info('[supabase] client initialized (anon key masked).');
}
