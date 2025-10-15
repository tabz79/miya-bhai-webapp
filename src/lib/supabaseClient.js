// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// === temporary diagnostic logging (safe for production) ===
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase] ❌ Missing env vars:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '(present)' : '(missing)',
  });
} else {
  console.log(
    '[supabase] ✅ Env vars loaded:',
    supabaseUrl,
    supabaseAnonKey.slice(0, 10) + '…'
  );
}

// === create the client ===
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

console.info('[supabase] client initialized (anon key masked).');
