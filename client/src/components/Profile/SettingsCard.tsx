
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function SettingsCard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">Log in to manage your settings.</p>
        <Button className="bg-brand-teak text-white hover:bg-brand-teak/90">Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Account</h4>
        <Button variant="outline" className="mt-2 w-full">Change Password</Button>
      </div>
      <div>
        <h4 className="font-semibold">Notifications</h4>
        <div className="flex justify-between items-center mt-2">
          <span>Push Notifications</span>
          {/* Placeholder for a toggle switch */}
          <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center cursor-pointer">
            <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
