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
 * This function performs an "upsert" on the addresses table.
 * @param {string} userId - The UUID of the user.
 * @param {object} addressData - The address data to save (e.g., line1, postal_code).
 * @returns {Promise<object>}
 */
export async function upsertUserAddress(userId, addressData) {
  // Ensure only expected fields are sent to the addresses table
  const { line1, line2, city, state, postal_code, country } = addressData;
  const payload = {
    user_id: userId,
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
  };

  const { data: result, error } = await supabase
    .from('addresses')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[userService.upsertUserAddress] Error:', error);
    throw new Error('Could not save user address.');
  }

  return result;
}

/**
 * Updates a user's profile information (e.g., name, phone).
 * @param {string} userId - The UUID of the user.
 * @param {object} profileData - The profile data to update.
 * @returns {Promise<object>}
 */
export async function updateUserProfile(userId, profileData) {
  // Ensure only expected fields are sent to the profiles table
  const { full_name, phone } = profileData;
  const payload = { full_name, phone };

  const { data: result, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[userService.updateUserProfile] Error:', error);
    throw new Error('Could not update user profile.');
  }

  return result;
}
