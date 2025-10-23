
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function AddressesCard() {
  const { user } = useAuth();
  const addresses = user?.addresses || [];

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">Log in to manage your addresses.</p>
        <Button className="bg-brand-teak text-white hover:bg-brand-teak/90">Login</Button>
      </div>
    );
  }

  // The parent component should handle the main loading state
  // if (isLoading) return <p>Loading addresses...</p>;
  // if (error) return <p className="text-red-500">Could not load addresses.</p>;

  return (
    <div className="space-y-4">
      {addresses.length > 0 ? (
        addresses.map((address: any) => (
          <div key={address.id} className="p-3 border rounded-md">
            <p className="font-semibold">{address.line1}</p> {/* Corrected from address.street */}
            <p className="text-sm text-gray-600">{address.city}, {address.state} {address.postal_code}</p> {/* Corrected from address.zip */}
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
