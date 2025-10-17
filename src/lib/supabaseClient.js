// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// --- Universal env resolver (works in both Vite + Node) ---
const getEnv = () => {
  // If running in Node (Render, SSR, etc.)
  if (typeof process !== 'undefined' && process.env) {
    return {
      SUPABASE_URL:
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        '',
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        '',
    };
  }

  // If running in Vite/browser environment
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }

  return { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
};

const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

// === diagnostic logging (safe, redacted) ===
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[supabase] ❌ Missing env vars:', {
    SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '(present)' : '(missing)',
  });
} else {
  console.log(
    '[supabase] ✅ Env vars loaded:',
    SUPABASE_URL,
    SUPABASE_ANON_KEY.slice(0, 10) + '…'
  );
}

// === create supabase client ===
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

console.info('[supabase] client initialized (anon key masked).');
