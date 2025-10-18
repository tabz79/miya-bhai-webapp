// src/services/userService.js
import { supabase } from '../lib/supabaseClient.js';

/**
 * Fetches a user's profile, including their most recent address.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
  try {
    // 1. Fetch the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // 2. Fetch the user's addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (addressesError) {
      throw addressesError;
    }

    // 3. Combine the results
    if (!profile) return null;
    
    return {
      ...profile,
      addresses: addresses || [],
    };

  } catch (error) {
    console.error('[userService.getUserProfile] Error:', error);
    throw new Error('Could not fetch user profile.');
  }
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
