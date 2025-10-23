import React from 'react';
import { useAuth } from '@/context/AuthContext';
import ProfileForm from './ProfileForm';

export default function CompleteProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-center mb-4">Complete Your Profile</h2>
      <p className="text-center text-gray-600 mb-8">
        Welcome! Please provide a few more details to complete your registration.
      </p>
      <ProfileForm userId={user.id} />
    </div>
  );
}
