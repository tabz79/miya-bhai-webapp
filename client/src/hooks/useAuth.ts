import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export function useAuth() {
  const { session, user, profile, loading, setSession } = useAuthStore();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      await setSession(data.session);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession]);

  const isAdmin = profile?.role === 'admin';

  return { session, loading, user, profile, isAdmin };
}
