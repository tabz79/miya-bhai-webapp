
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

async function fetchAddresses() {
  const res = await fetch('/api/user/addresses');
  if (!res.ok) {
    throw new Error('Failed to fetch addresses');
  }
  return res.json();
}

export function AddressesCard() {
  const { user } = useAuth();
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">Log in to manage your addresses.</p>
        <Button className="bg-brand-teak text-white hover:bg-brand-teak/90">Login</Button>
      </div>
    );
  }

  if (isLoading) return <p>Loading addresses...</p>;
  if (error) return <p className="text-red-500">Could not load addresses.</p>;

  return (
    <div className="space-y-4">
      {addresses && addresses.length > 0 ? (
        addresses.map((address: any) => (
          <div key={address.id} className="p-3 border rounded-md">
            <p className="font-semibold">{address.street}</p>
            <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zip}</p>
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
