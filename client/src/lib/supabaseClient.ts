// client/src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Try multiple possible env names so the runtime can work even if your scripts use different prefixes.
const rawCandidates = {
  VITE_SUPABASE_URL: (import.meta.env as any).VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: (import.meta.env as any).VITE_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL: (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: (import.meta.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_URL: (import.meta.env as any).SUPABASE_URL,
  SUPABASE_ANON_KEY: (import.meta.env as any).SUPABASE_ANON_KEY,
};

// Choose first non-empty URL & key from common names (VITE_* preferred)
const SUPABASE_URL =
  rawCandidates.VITE_SUPABASE_URL ||
  rawCandidates.NEXT_PUBLIC_SUPABASE_URL ||
  rawCandidates.SUPABASE_URL ||
  undefined;

const SUPABASE_ANON_KEY =
  rawCandidates.VITE_SUPABASE_ANON_KEY ||
  rawCandidates.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  rawCandidates.SUPABASE_ANON_KEY ||
  undefined;

export function getEnvSnapshot() {
  return {
    SUPABASE_URL: SUPABASE_URL ? 'FOUND' : 'MISSING',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING',
    raw: {
      VITE_SUPABASE_URL: Boolean(rawCandidates.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: Boolean(rawCandidates.VITE_SUPABASE_ANON_KEY),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(rawCandidates.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(rawCandidates.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_URL: Boolean(rawCandidates.SUPABASE_URL),
      SUPABASE_ANON_KEY: Boolean(rawCandidates.SUPABASE_ANON_KEY),
    },
  };
}

export const isSupabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// HMR/global guard to ensure a single Supabase client instance in the browser
declare global {
  // eslint-disable-next-line no-var
  var __MIYA_BHAI_SUPABASE__: SupabaseClient | undefined;
}

let supabase: SupabaseClient | null = null;

if (!isSupabaseReady) {
  console.warn('Supabase client not initialized. Missing envs. Snapshot:', getEnvSnapshot());
} else {
  if (!(globalThis as any).__MIYA_BHAI_SUPABASE__) {
    (globalThis as any).__MIYA_BHAI_SUPABASE__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  supabase = (globalThis as any).__MIYA_BHAI_SUPABASE__;
  console.info('Supabase client initialized (client-side anon).');
}

// ✅ Export both default and named — works for all imports
export { supabase };
export default supabase;
