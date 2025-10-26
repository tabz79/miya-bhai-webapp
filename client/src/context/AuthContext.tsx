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
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log('[AuthContext] Mounting and setting up listener.');

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(`[AuthContext] onAuthStateChange event: ${_event}`);
        setSession(session);
        if (_event === 'INITIAL_SESSION') {
          console.log('[AuthContext] Initial session event.');
        }

        if (session?.user) {
          console.log('[AuthContext] Session found. Fetching profile...');
          try {
            const profile = await api.getUserProfile();
            const fullUser = { ...session.user, ...profile };
            setUser(fullUser);
            setIsAdmin(fullUser.role === 'admin');
            console.log('[AuthContext] Profile fetched and user state set.', fullUser);
          } catch (error) {
            console.error('[AuthContext] Error fetching profile:', error);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log('[AuthContext] No session found.');
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
        console.log('[AuthContext] Auth processing finished. Loading set to false.');
      }
    );

    return () => {
      console.log('[AuthContext] Unmounting and unsubscribing from listener.');
      authListener?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const value = {
    session,
    user,
    loading,
    isAdmin,
    logout,
  };

  return (
    <div style={{
      backgroundColor: 'red',
      color: 'white',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '2rem',
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: '2rem'
    }}>
      AUTH PROVIDER IS NOT UPDATING. THE BUILD IS CACHED. PLEASE CLEAR THE BUILD CACHE.
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
