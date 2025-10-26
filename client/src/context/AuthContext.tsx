import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import api from '@/services/api';

// Define the shape of the full user profile
export interface UserProfile extends User {
  addresses?: any[]; // Or a more specific Address type
  role?: string;
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
    const fetchSessionAndProfile = async () => {
      try {
        setLoading(true);
        const { data: { session }, } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          try {
            // If a session exists, fetch the full profile from our backend
            const profile = await api.getUserProfile();
            const fullUser = { ...session.user, ...profile };
            setUser(fullUser);
            setIsAdmin(fullUser.role === 'admin');
          } catch (error) {
            console.error('Error fetching profile on session fetch:', error);
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error fetching session and profile:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            const profile = await api.getUserProfile();
            const fullUser = { ...session.user, ...profile };
            setUser(fullUser);
            setIsAdmin(fullUser.role === 'admin');
          } catch (error) {
            console.error('Error fetching profile on auth change:', error);
            setUser(null); // Treat as not logged in if profile fails
            setIsAdmin(false);
          }
        } else {
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
    setIsAdmin(false);
  };

  const value = {
    session,
    user,
    loading,
    isAdmin,
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
