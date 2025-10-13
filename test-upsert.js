// test-upsert.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// load the backend .env in src/ (adjust if you put backend .env somewhere else)
dotenv.config({ path: path.resolve(__dirname, 'src', '.env') });

// fallback to process.env if you already exported vars in shell
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in env. Aborting.');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  try {
    const testId = randomUUID();
    console.log('Attempting upsert into profiles with user_id =', testId);

    const payload = {
      user_id: testId,
      email: `debug+${testId.slice(0,8)}@example.com`,
      full_name: 'Debug User',
      created_at: new Date().toISOString(),
    };

    const res = await sb.from('profiles').upsert(payload, { onConflict: 'user_id' }).select();

    console.log('Result:\n', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

run();
