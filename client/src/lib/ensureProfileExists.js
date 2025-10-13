// src/lib/ensureProfileExists.js
import 'dotenv/config';
import { supabase } from './supabaseClient';

/**
 * ensureProfileExists(supabaseServiceClient, userId, opts?)
 *
 * - Checks if a user row exists in `users`. If missing, inserts a minimal user row.
 * - Then upserts a profile row into `profiles`.
 * - Returns { ok: true, user, profile } or { ok: false, error }
 *
 * Usage:
 *   import { supabase as sb } from '../lib/supabase.js' // your service client
 *   await ensureProfileExists(sb, userId, { email, name })
 */

export async function ensureProfileExists(supabaseClient, userId, opts = {}) {
  const { email, name, fallbackToEmail = true } = opts;

  if (!supabaseClient) {
    return { ok: false, error: new Error('supabase client required') };
  }
  if (!userId) {
    return { ok: false, error: new Error('userId required') };
  }

  try {
    // 1) ensure user exists in `users`
    const { data: existingUser, error: selectErr } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    let user = existingUser ?? null;

    if (!user) {
      // create a minimal user record (safe: ignore unique failures)
      const payload = {
        id: userId,
        email: email || null,
        name: name || null,
        created_at: new Date().toISOString(),
      };

      const { data: createdUsers, error: insertErr } = await supabaseClient
        .from('users')
        .insert([payload])
        .select();

      if (insertErr) {
        // If insert failed because user already exists (race), refetch
        console.warn('[ensureProfileExists] users insert failed:', insertErr.message || insertErr);
        const { data: tryUser, error: tryErr } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (tryErr) {
          return { ok: false, error: insertErr };
        }
        user = tryUser ?? null;
      } else {
        user = (createdUsers && createdUsers[0]) || null;
      }
    }

    // 2) upsert profile
    const profilePayload = {
      user_id: userId,
      // prefer explicit email param, else fallback to user.email if present
      email: email ?? (user && user.email) ?? null,
      full_name: name ?? (user && user.name) ?? null,
      updated_at: new Date().toISOString(),
    };

    // We only include keys that actually exist to avoid PGRST schema cache issues.
    // Build an object with only non-undefined keys
    const cleanPayload = {};
    for (const k of Object.keys(profilePayload)) {
      if (profilePayload[k] !== undefined) cleanPayload[k] = profilePayload[k];
    }

    const { data: profileData, error: profileErr } = await supabaseClient
      .from('profiles')
      .upsert(cleanPayload, { onConflict: 'user_id' })
      .select();

    if (profileErr) {
      console.error('[ensureProfileExists] profiles upsert failed:', profileErr);
      return { ok: false, error: profileErr };
    }

    return { ok: true, user, profile: profileData && profileData[0] ? profileData[0] : null };
  } catch (err) {
    console.error('[ensureProfileExists] unexpected error', err);
    return { ok: false, error: err };
  }
}

export default ensureProfileExists;
