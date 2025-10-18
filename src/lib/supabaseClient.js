// src/lib/supabaseClient.js
// SERVER-ONLY Supabase client: NO import.meta usage.
// Node parses entire file; any mention of "import.meta" would crash parsing.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseServiceKey =
  (process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
  // Do not print secrets — just indicate presence
  console.error('[supabaseServer] Missing env vars (SUPABASE_URL or SUPABASE_SERVICE_KEY). Check Render environment.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
