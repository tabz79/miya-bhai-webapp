
// src/lib/ensureProfileExists.js

/**
 * Ensures a profile exists for a given user ID.
 * If the profile does not exist, it creates one using the provided details.
 *
 * @param {object} supabase - The Supabase client instance (should be admin client to bypass RLS).
 * @param {string} userId - The user's unique ID.
 * @param {object} details - An object with user details like email and name.
 * @returns {Promise<{ok: boolean, profile: object|null, error: object|null}>}
 */
export default async function ensureProfileExists(supabase, userId, details = {}) {
  if (!supabase || !userId) {
    const error = new Error('Supabase client and userId are required.');
    console.error('[ensureProfileExists]', error.message);
    return { ok: false, profile: null, error };
  }

  try {
    // 1. Ensure a record exists in public.users to satisfy foreign keys
    const { error: userError } = await supabase
      .from('users')
      .upsert({ id: userId, email: details.email }, { onConflict: 'id' });

    if (userError) {
      console.error('[ensureProfileExists] Error upserting to public.users:', userError);
      return { ok: false, profile: null, error: userError };
    }

    // 2. Check if a profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('[ensureProfileExists] Error checking for profile:', selectError);
      return { ok: false, profile: null, error: selectError };
    }

    // 3. If profile exists, we're done
    if (existingProfile) {
      return { ok: true, profile: existingProfile, error: null };
    }

    // 4. If no profile, create one
    console.log(`[ensureProfileExists] No profile found for user ${userId}. Creating one.`);
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: details.email || null,
        full_name: details.name || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ensureProfileExists] Error creating profile:', insertError);
      return { ok: false, profile: null, error: insertError };
    }

    console.log(`[ensureProfileExists] Successfully created profile for user ${userId}.`);
    return { ok: true, profile: newProfile, error: null };

  } catch (err) {
    console.error('[ensureProfileExists] Unexpected error:', err);
    return { ok: false, profile: null, error: err };
  }
}
