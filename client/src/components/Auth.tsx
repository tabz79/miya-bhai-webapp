// client/src/components/Auth.tsx
import React, { useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Determine the base URL for redirects
  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  // 🔹 Magic Link Login
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('[login] Magic link requested for email (masked):', `${email.replace(/(.{2}).+(@.+)/, '$1***$2')}`);

    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${appBaseUrl}/auth/callback`,
        },
      });

      if (error) {
        console.error('[login] Magic link send error:', error.message);
        toast({
          title: 'Error sending magic link',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('[login] Magic link sent successfully');
        toast({
          title: 'Magic link sent!',
          description: 'Check your email for the login link.',
        });
      }
    } catch (err) {
      console.error('[login] Unexpected error:', err);
      toast({
        title: 'Error sending magic link',
        description: 'Unexpected error. Check console.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 GitHub OAuth Login
  const handleGitHubLogin = async () => {
    setLoading(true);
    console.log('[login] GitHub OAuth started...');
    const supabase = getSupabase();
    if (!supabase) return;
    try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${appBaseUrl}/auth/callback?hash={hash}`,
      },
    });

      if (error) {
        console.error('[login] GitHub OAuth error:', error.message);
        toast({
          title: 'GitHub login failed',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        console.log('[login] Redirecting to GitHub OAuth...');
      }
    } catch (err) {
      console.error('[login] GitHub OAuth unexpected error:', err);
      toast({
        title: 'GitHub login failed',
        description: 'Unexpected error. Check console.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // 🔹 Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('[login] Google OAuth started...');
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // IMPORTANT: route callback to our client callback so AuthCallback can capture session
          redirectTo: `${appBaseUrl}/auth/callback`,
        },
      });

      if (error) {
        console.error('[login] Google OAuth error:', error.message);
        toast({
          title: 'Google login failed',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        console.log('[login] Redirecting to Google OAuth...');
      }
    } catch (err) {
      console.error('[login] Google OAuth unexpected error:', err);
      toast({
        title: 'Google login failed',
        description: 'Unexpected error. Check console.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 rounded-md shadow-sm bg-white text-center">
      <h2 className="text-lg font-semibold mb-4">Sign in</h2>

      {/* Magic Link Form */}
      <form onSubmit={handleMagicLinkLogin}>
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
          disabled={loading}
        />
        <Button type="submit" className="w-full mb-4" disabled={loading}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* GitHub Login */}
      <Button
        onClick={handleGitHubLogin}
        className="w-full"
        variant="outline"
        disabled={loading}
      >
        {loading ? 'Redirecting...' : 'Sign in with GitHub'}
      </Button>

      {/* Google Login */}
      <Button
        onClick={handleGoogleLogin}
        className="w-full mt-4"
        variant="outline"
        disabled={loading}
      >
        {loading ? 'Redirecting...' : 'Sign in with Google'}
      </Button>
    </div>
  );
}
