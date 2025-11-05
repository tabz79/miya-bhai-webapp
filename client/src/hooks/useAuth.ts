import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export function useAuth() {
  const { session, user, profile, setSession, setUserAndProfile } = useAuthStore(); // Get new state and action
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession); // Update session and user in store

      if (currentSession?.user) {
        // Fetch profile after session is set
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, role') // Explicitly select role and any other needed fields
          .eq('user_id', currentSession.user.id)
          .maybeSingle({
            headers: { 'Accept': 'application/vnd.pgrst.object+json' } // Explicitly set Accept header
          });

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserAndProfile(currentSession.user, null); // Set user but no profile
        } else {
          setUserAndProfile(currentSession.user, profileData); // Set user and fetched profile
        }
      } else {
        setUserAndProfile(null, null); // No user, no profile
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession); // Update session and user in store
      if (newSession?.user) {
        // Re-fetch profile on auth state change
        getSessionAndProfile(); // Re-run to fetch profile
      } else {
        setUserAndProfile(null, null); // Clear user and profile on logout
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setSession, setUserAndProfile]); // Add setUserAndProfile to dependency array

  const isAdmin = profile?.role === 'admin';

  return { session, loading, user, profile, isAdmin }; // Return profile and isAdmin status
}
