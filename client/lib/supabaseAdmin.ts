// client/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// These env vars are set on Vercel (server-only). Do NOT expose these to the browser.
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // harmless dev-time warning
  // eslint-disable-next-line no-console
  console.warn('supabaseAdmin: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// named export used by your serverless function
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// also default export so other files can import either style
export default supabaseAdmin;
