// src/services/userService.js
import { supabase } from '../lib/supabaseClient.js';

/**
 * Fetches a user's profile, including their most recent address.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      addresses (
        *
      )
    `)
    .eq('id', userId)
    .order('created_at', { foreignTable: 'addresses', ascending: false })
    .limit(1, { foreignTable: 'addresses' })
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = single row not found
    console.error('[userService.getUserProfile] Error:', error);
    throw new Error('Could not fetch user profile.');
  }

  return profile;
}

/**
 * Updates or creates a user's address.
 * This function performs an "upsert":
 * - If an address ID is provided, it updates that address.
 * - If no ID is provided, it creates a new address and marks it as default.
 * @param {string} userId - The UUID of the user.
 * @param {object} addressData - The address data to save.
 * @returns {Promise<object>}
 */
export async function upsertUserAddress(userId, addressData) {
  const { id, ...data } = addressData;
  
  const payload = {
    user_id: userId,
    ...data,
  };

  // If there's no ID, we assume it's a new address.
  // We could also add logic to check for existing addresses to avoid duplicates.
  const { data: result, error } = await supabase
    .from('addresses')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('[userService.upsertUserAddress] Error:', error);
    throw new Error('Could not save user address.');
  }

  return result;
}
