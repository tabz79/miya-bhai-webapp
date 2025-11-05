import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export function useAuth() {
  const { session, user, profile, setSession, setUserAndProfile } = useAuthStore(); // Get new state and action
  const [loading, setLoading] = useState(true);

  const getSessionAndProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserAndProfile(currentSession.user, null);
        } else {
          setUserAndProfile(currentSession.user, profileData);
        }
      } else {
        setUserAndProfile(null, null);
      }
    } catch (error) {
      console.error("Error in getSessionAndProfile: ", error);
    } finally {
      setLoading(false);
    }
  }, [setSession, setUserAndProfile]);

  useEffect(() => {
    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        getSessionAndProfile();
      } else {
        setUserAndProfile(null, null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [getSessionAndProfile, setSession, setUserAndProfile]);

  const isAdmin = profile?.role === 'admin';

  return { session, loading, user, profile, isAdmin }; // Return profile and isAdmin status
}
