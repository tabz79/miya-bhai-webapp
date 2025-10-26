import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import api from '@/services/api';

// Define the shape of the full user profile
export interface UserProfile extends User {
  addresses?: any[]; // Or a more specific Address type
  // Add other profile fields here, e.g., full_name, phone
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      console.log('[AuthContext] Starting session and profile fetch...');
      try {
        setLoading(true);
        console.log('[AuthContext] Calling supabase.auth.getSession()...');
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('[AuthContext] supabase.auth.getSession() returned. Session:', session);
        setSession(session);

        if (session?.user) {
          try {
            console.log('[AuthContext] Calling api.getUserProfile()...');
            // If a session exists, fetch the full profile from our backend
            const profile = await api.getUserProfile();
            console.log('[AuthContext] api.getUserProfile() returned. Profile:', profile);
            const fullUser = { ...session.user, ...profile };
            setUser(fullUser);
            setIsAdmin(fullUser.role === 'admin');
          } catch (error) {
            console.error('[AuthContext] Error fetching profile on session fetch:', error);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log('[AuthContext] No session user found.');
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error in fetchSessionAndProfile:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        console.log('[AuthContext] fetchSessionAndProfile finally block. Setting loading to false.');
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[AuthContext] onAuthStateChange triggered. Event:', _event);
        setSession(session);
        if (session?.user) {
          try {
            console.log('[AuthContext] onAuthStateChange: calling api.getUserProfile()...');
            const profile = await api.getUserProfile();
            console.log('[AuthContext] onAuthStateChange: api.getUserProfile() returned. Profile:', profile);
            const fullUser = { ...session.user, ...profile };
            setUser(fullUser);
            setIsAdmin(fullUser.role === 'admin');
          } catch (error) {
            console.error('[AuthContext] onAuthStateChange: Error fetching profile:', error);
            setUser(null); // Treat as not logged in if profile fails
            setIsAdmin(false);
          }
        } else {
          console.log('[AuthContext] onAuthStateChange: No session user.');
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    session,
    user,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
