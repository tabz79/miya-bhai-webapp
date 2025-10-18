// lib/supabaseClient.js
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

// === create supabase client ===
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});