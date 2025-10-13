import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export type ProfilePayload = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  branch?: string | null;
};

type Props = {
  initial?: Partial<ProfilePayload> | null;
  userId: string;
  onSave?: (newProfile: ProfilePayload) => void;
  onCancel?: () => void;
};

export default function ProfileForm({ initial = null, userId, onSave, onCancel }: Props) {
  const [full_name, setFullName] = useState<string>(initial?.full_name ?? '');
  const [phone, setPhone] = useState<string>(initial?.phone ?? '');
  const [avatar_url, setAvatarUrl] = useState<string>(initial?.avatar_url ?? '');
  const [branch, setBranch] = useState<string>(initial?.branch ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const validatePhone = (p: string) => {
    if (!p) return true;
    return /^[0-9+\-()\s]{7,15}$/.test(p);
  };

  const handleSave = async () => {
    if (!validatePhone(phone)) {
      toast?.({
        title: 'Invalid phone',
        description: 'Please enter a valid phone number before saving.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);

    const payload = {
      full_name: full_name || null,
      phone: phone || null,
      avatar_url: avatar_url || null,
      branch: branch || null,
    };

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const saved = await res.json();
      onSave?.(saved);
      toast?.({
        title: 'Profile saved',
        description: 'Your profile changes were saved successfully.',
      });
    } catch (err) {
      console.error('Unexpected save error', err);
      toast?.({
        title: 'Save failed',
        description: err.message || 'Unexpected error. See console.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 bg-white p-3 rounded-md shadow-sm">
      <label className="block text-xs text-gray-600">Full name</label>
      <input
        value={full_name}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="e.g., Tabrez Khan"
        disabled={isSaving}
      />

      <label className="block text-xs text-gray-600">Phone</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="+91 98765 43210"
        disabled={isSaving}
      />

      <label className="block text-xs text-gray-600">Avatar URL</label>
      <input
        value={avatar_url}
        onChange={(e) => setAvatarUrl(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="https://... (optional)"
        disabled={isSaving}
      />

      <label className="block text-xs text-gray-600">Branch</label>
      <input
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
        className="w-full px-3 py-2 border rounded"
        placeholder="e.g., Jubilee Hills"
        disabled={isSaving}
      />

      <div className="flex gap-2 mt-2">
        <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="flex-1" disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
