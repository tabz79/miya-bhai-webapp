// client/src/pages/Profile.tsx
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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

// No longer need a separate ProfileRecord, the user from useAuth is the source of truth
export function Profile() {
  // loading and user now come from the single, reliable AuthContext
  const { loading, user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { toast } = useToast();

  // This local state is for the ProfileForm, which is fine.
  // We'll pre-fill it from the user object.
  const [profileData, setProfileData] = useState<ProfilePayload | undefined>(undefined);

  React.useEffect(() => {
    if (user) {
      setProfileData({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        phone: (user as any).phone || '', // Cast to any to access phone if it exists
      });
    } else {
      setProfileData(undefined);
    }
  }, [user]);


  const handleSignOut = async () => {
    await logout();
    toast({
      title: '✅ Signed out',
      description: 'You have been signed out successfully.',
    });
    // No need to reload, the context change will re-render the app
  };

  // Simplified display logic, directly from the user object
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = (user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  const handleProfileSave = (p: ProfilePayload) => {
    // This is an optimistic update. The actual update happens in the form.
    // We can update the local state to reflect the change immediately.
    setProfileData(p);
    setEditing(false);
    toast({
      title: 'Profile updated',
      description: 'Your profile changes were saved.',
    });
  };

  return (
    <div className="w-full min-h-screen bg-app-background">
      <div className="p-4 border-b border-gray-200 bg-app-background">
        {/* The loading logic is now much simpler */}
        {loading ? (
          <div className="h-16 animate-pulse bg-gray-200 rounded-md" />
        ) : user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 bg-brand-teak rounded-full flex items-center justify-center"
                title={displayName}
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
                {(user as any).phone && (
                  <p className="text-gray-400 text-xs mt-1">
                    📞 {(user as any).phone}
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
          // This is the state when not loading and no user exists. The login button appears.
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
        {editing && user && profileData && (
          <CollapsibleCard title="Edit Profile" defaultOpen>
            <ProfileForm
              userId={user.id}
              initial={profileData}
              onSave={handleProfileSave}
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
          >
            Sign Out
          </Button>
        </div>
      )}

      <div className="h-[49px]" />
      <BottomNav />
    </div>
  );
}