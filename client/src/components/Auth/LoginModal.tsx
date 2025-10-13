// client/src/components/LoginModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type Props = {
  open: boolean;
  onClose: () => void;
};

const COOLDOWN_SECONDS = 90;

export default function LoginModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setIsSending(false);
      setCooldown(0);
    }
  }, [open]);

  if (!open) return null;

  async function sendBackendMagicLink(fallbackEmail: string) {
    try {
      const resp = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fallbackEmail }),
      });
      if (resp.status === 429) {
        toast?.({
          title: 'Rate limited',
          description: 'Server is rate limiting sends. Try again later.',
          variant: 'destructive',
        });
        setCooldown(COOLDOWN_SECONDS);
        return { ok: false, reason: 'server-rate-limit' };
      }
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        console.error('backend magic link send failed', body);
        toast?.({
          title: 'Failed',
          description: 'Server failed to send magic link. See console.',
          variant: 'destructive',
        });
        return { ok: false, reason: 'server-failed' };
      }
      toast?.({
        title: 'Magic link sent (fallback)',
        description: `Sent via server to ${fallbackEmail}.`,
      });
      setCooldown(COOLDOWN_SECONDS);
      return { ok: true };
    } catch (err) {
      console.error('backend send error', err);
      toast?.({
        title: 'Network error',
        description: 'Could not contact backend to send link.',
        variant: 'destructive',
      });
      return { ok: false, reason: 'network' };
    }
  }

  const handleSend = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast?.({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (cooldown > 0 || isSending) {
      toast?.({
        title: 'Please wait',
        description: `Try again in ${cooldown}s.`,
        variant: 'default',
      });
      return;
    }

    setIsSending(true);

    try {
      const redirect = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });

      if (!error) {
        toast?.({
          title: 'Magic link sent',
          description: `Check ${email} and follow the link to sign in.`,
        });
        setEmail('');
        onClose();
        setCooldown(COOLDOWN_SECONDS);
        return;
      }

      console.warn('Supabase signInWithOtp error', error);

      const message = (error as any).message || '';
      const status = (error as any).status || (error as any).statusCode;

      if (status === 429 || /rate limit|limit exceeded/i.test(message)) {
        toast?.({
          title: 'Rate limited',
          description:
            'Supabase rate limit hit — attempting fallback send via server.',
          variant: 'default',
        });

        const result = await sendBackendMagicLink(email);
        if (result.ok) {
          setEmail('');
          onClose();
          return;
        } else {
          if (result.reason !== 'server-rate-limit') {
            setCooldown(COOLDOWN_SECONDS);
          }
          return;
        }
      }

      toast?.({
        title: 'Failed to send link',
        description: 'See console for details.',
        variant: 'destructive',
      });
      console.error('Magic link error', error);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      console.error('Unexpected error sending magic link', err);
      toast?.({
        title: 'Error',
        description: 'Unexpected error. See console.',
        variant: 'destructive',
      });
      await sendBackendMagicLink(email);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Sign in</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enter your email and we'll send a magic link to sign in.
        </p>

        <label className="block text-xs text-gray-600">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3 focus:outline-none focus:ring focus:ring-indigo-500"
          placeholder="you@company.com"
          disabled={isSending}
        />

        <div className="flex gap-2 mt-2">
          <Button
            onClick={handleSend}
            className="flex-1"
            disabled={isSending || cooldown > 0}
          >
            {isSending
              ? 'Sending…'
              : cooldown > 0
              ? `Try again in ${cooldown}s`
              : 'Send magic link'}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isSending}
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Tip: If you don’t see the email, check spam. If rate-limited, the app
          will attempt a server fallback.
        </p>
      </div>
    </div>
  );
}
