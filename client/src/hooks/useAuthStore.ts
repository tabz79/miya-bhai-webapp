import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  role: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: async (session) => {
    const supabase = getSupabase();
    if (!supabase) return;
    set({ session, user: session?.user ?? null, loading: true });
    if (session?.user) {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          set({ profile: null });
        } else {
          set({ profile: profileData });
        }
      } catch (error) {
        console.error("Error in profile fetch catch: ", error);
        set({ profile: null });
      }
    } else {
      set({ profile: null });
    }
    set({ loading: false });
  },

  logout: () => {
    set({ session: null, user: null, profile: null });
  },
}));