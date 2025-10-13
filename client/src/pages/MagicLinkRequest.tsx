
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function MagicLinkRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // This URL must be listed in your Supabase project's redirect URLs
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage('Success! Please check your email for the sign-in link.');
      toast({
        title: 'Link Sent',
        description: 'Check your email for the sign-in link.',
      });
    } catch (error: any) {
      console.error('[MagicLinkRequest] Supabase signInWithOtp error:', error);
      setMessage(`Error: ${error.message || 'Failed to send magic link.'}`);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send link.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-sm p-4 mt-20">
      <h1 className="text-2xl font-bold text-center mb-4">Sign In / Sign Up</h1>
      <p className="text-center text-gray-600 mb-6">Enter your email to receive a magic link to sign in without a password.</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </form>
      {message && <p className="mt-4 text-center text-sm font-medium">{message}</p>}
    </div>
  );
}
