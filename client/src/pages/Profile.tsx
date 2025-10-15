import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { BottomNav } from '../components/BottomNav';
import { CollapsibleCard } from '../components/Profile/CollapsibleCard';
import { OrdersCard } from '../components/Profile/OrdersCard';
import { AddressesCard } from '../components/Profile/AddressesCard';
import { SettingsCard } from '../components/Profile/SettingsCard';
import { restaurantInfo } from '../data/mockData';
import { Button } from '@/components/ui/button';
import ProfileForm, { ProfilePayload } from '@/components/Profile/ProfileForm';
import { useToast } from '@/components/ui/use-toast';
import { Auth } from '@/components/Auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProfileRecord = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  branch?: string | null;
};

export function Profile() {
  const { session, loading, user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper: fetch profile by a given userId (used when user.id becomes available)
  const fetchProfileById = async (userId: string | null) => {
    if (!userId) return null;
    try {
      setIsFetchingProfile(true);

      // --- BEGIN TEMPORARY DEBUG LOG ---
      console.log(`[DEBUG] Preparing to fetch profile for user_id: ${userId}. PO: Check fetch-logger for headers on the following request.`);
      // --- END TEMPORARY DEBUG LOG ---

      const { data, error } = await supabase
        .from<ProfileRecord>('profiles')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching profile:', error);
        toast?.({
          title: 'Profile load failed',
          description: 'Check console for details.',
          variant: 'destructive',
        });
      }
      // If data is not null and has entries, return the first one. Otherwise, return null.
      return data?.[0] ?? null;
    } catch (err) {
      console.error('Unexpected fetchProfile error', err);
      toast?.({
        title: 'Profile load failed',
        description: 'Unexpected error. See console.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // This check is now based on user.id, which is a stable primitive
      if (!user?.id) {
        if (mounted) setProfile(null);
        return;
      }

      // Normal path: user.id exists — fetch profile directly
      const fetched = await fetchProfileById(user.id);
      if (mounted) setProfile(fetched);
    };

    run();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      // First, sign out from Supabase
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.error('Supabase sign out error:', supabaseError);
        toast?.({
          title: 'Sign out failed',
          description: 'Could not sign out from Supabase. Check console.',
          variant: 'destructive',
        });
        // Do not stop here; still attempt to clear the server session
      }

      // Then, hit the backend logout endpoint to clear the session cookie
      // Use relative path to leverage Vite proxy; if proxy unreliable, replace with absolute backend URL
      const logoutUrl = '/api/auth/logout';
      const res = await fetch(logoutUrl, {
        method: 'POST',
        credentials: 'include', // critical so browser will accept Set-Cookie from backend
      });

      if (!res.ok) {
        console.error('API logout error:', await res.text());
        toast?.({
          title: 'Server logout failed',
          description: 'Session may not be fully cleared. Check console.',
          variant: 'destructive',
        });
        // continue: still clear client state and invalidate cache to avoid stale UI
      }

      setProfile(null);
      toast?.({
        title: '✅ Signed out',
        description: 'You have been signed out successfully.',
      });

      // Reload the page to reset the app state
      try {
        await queryClient.invalidateQueries(['user']);
      } catch (e) {
        // ignore
      }

      window.location.reload();

    } catch (err) {
      console.error('Unexpected signOut error', err);
      toast?.({
        title: 'Sign out failed',
        description: 'Unexpected error. See console.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.name) ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const avatarLetter =
    (profile?.full_name || (user?.user_metadata?.name) || 'U')
      .charAt(0)
      .toUpperCase();

  const handleProfileSave = (p: ProfilePayload) => {
    setProfile((prev) => ({
      ...(prev ?? { id: user?.id ?? p.id }),
      ...p,
    }));
    setEditing(false);
    toast?.({
      title: 'Profile updated',
      description: 'Your profile changes were saved.',
    });
  };

  // 🧩 If user exists but has no id and server re-check didn't find one, show fallback
  if (user && !user.id && !profile) {
    return (
      <div className="w-full min-h-screen bg-app-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Welcome, {user.email}</h2>
        <p className="text-gray-600 max-w-sm mb-4">
          We created a temporary session for you, but your account isn’t yet
          linked to a user record in the database.
        </p>
        <p className="text-sm text-gray-500">
          Please contact an admin or complete registration.
        </p>
        <div className="mt-6">
          <Button onClick={() => setLoginOpen(true)} className="bg-brand-teak text-white hover:bg-brand-teak/90">
            Log in again
          </Button>
        </div>
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login</DialogTitle>
            </DialogHeader>
            <Auth />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-app-background">
      <div className="p-4 border-b border-gray-200 bg-app-background">
        {loading || isFetchingProfile ? (
          <div className="h-16" />
        ) : user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 bg-brand-teak rounded-full flex items-center justify-center"
                title={profile?.full_name ?? user?.email}
              >
                <span className="text-white font-bold text-2xl">
                  {avatarLetter}
                </span>
              </div>
              <div>
                <h2 className="text-app-foreground font-bold text-xl">
                  {displayName}
                </h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
                {profile?.phone && (
                  <p className="text-gray-400 text-xs mt-1">
                    📞 {profile.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-brand-teak text-white hover:bg-brand-teak/90"
                >
                  Edit
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-app-foreground font-bold text-xl">Profile</h1>
            <Button
              onClick={() => setLoginOpen(true)}
              className="bg-brand-teak text-white hover:bg-brand-teak/90"
            >
              Login
            </Button>
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login</DialogTitle>
                </DialogHeader>
                <Auth />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {editing && user && (
          <CollapsibleCard title="Edit Profile" defaultOpen>
            <ProfileForm
              userId={user.id}
              initial={profile ?? undefined}
              onSave={(p) => handleProfileSave(p)}
              onCancel={() => setEditing(false)}
            />
          </CollapsibleCard>
        )}

        <CollapsibleCard title="Orders">
          <OrdersCard />
        </CollapsibleCard>

        <CollapsibleCard title="Addresses">
          <AddressesCard />
        </CollapsibleCard>

        <CollapsibleCard title="Settings">
          <SettingsCard />
        </CollapsibleCard>

        <CollapsibleCard title="About" defaultOpen>
          <div className="space-y-4 text-app-foreground text-sm leading-relaxed">
            {restaurantInfo.story
              .split('\n\n')
              .map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
          </div>
        </CollapsibleCard>
      </div>

      {user && (
        <div className="p-4 mt-4">
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      )}

      <div className="h-[49px]" />
      <BottomNav />
    </div>
  );
}
