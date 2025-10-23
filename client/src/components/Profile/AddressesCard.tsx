
import React from 'react';
import { useAuth } from '@/context/AuthContext'; // Corrected import path
import { Button } from '@/components/ui/button';

export function AddressesCard() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading addresses...</p>;

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Please log in to manage your addresses.</p>
      </div>
    );
  }

  // Addresses are now directly available from the user object
  const { addresses } = user;

  return (
    <div className="space-y-4">
      {addresses && addresses.length > 0 ? (
        addresses.map((address: any) => (
          <div key={address.id} className="p-3 border rounded-md">
            {/* Adjust property names based on your actual address object structure */}
            <p className="font-semibold">{address.line1}</p>
            <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postal_code}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>
        ))
      ) : (
        <p>No saved addresses.</p>
      )}
      <Button className="w-full bg-brand-teak text-white hover:bg-brand-teak/90">Add New Address</Button>
    </div>
  );
}
