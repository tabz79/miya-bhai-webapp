// src/services/addressService.js
import { supabase } from '../lib/supabase.js';

/**
 * Fetch addresses for a given user email
 */
export async function getAddressesByUserEmail(userEmail) {
  try {
    if (!userEmail) return [];

    // The user's email is not directly on the addresses table.
    // We need to join through the users table in auth.users to link addresses to an email.
    // However, Supabase RLS policies should handle this when the user is authenticated.
    // Let's first try a simpler query assuming RLS is set up.

    // First find the user_id from the email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('getAddressesByUserEmail: could not find user by email', { error: userError, userEmail });
      return [];
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAddressesByUserEmail: supabase error', { error, userEmail });
      return [];
    }

    return data;
  } catch (e) {
    console.error('getAddressesByUserEmail: exception', e);
    return [];
  }
}
