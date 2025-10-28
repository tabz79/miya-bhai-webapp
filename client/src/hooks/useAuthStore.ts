import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  role: string; // Assuming 'role' is a string column in your profiles table
  // Add other profile fields you need here
}

interface AuthState {
  session: Session | null;
  user: User | null; // Add user to state
  profile: Profile | null; // Add profile to state
  setSession: (session: Session | null) => void;
  setUserAndProfile: (user: User | null, profile: Profile | null) => void; // New action
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  user: null,
  profile: null,
  setSession: (session) => set({ session, user: session?.user ?? null }), // Update user when session changes
  setUserAndProfile: (user, profile) => set({ user, profile }), // New action
  logout: () => set({ session: null, user: null, profile: null }),
}));