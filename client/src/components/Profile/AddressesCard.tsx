
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

async function fetchAddresses() {
  return api.getUserAddresses();
}

export function AddressesCard() {
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  if (isLoading) return <p>Loading addresses...</p>;
  if (error) return <p className="text-red-500">Could not load addresses.</p>;

  return (
    <div className="space-y-4">
      {addresses && addresses.length > 0 ? (
        addresses.map((address: any) => (
          <div key={address.id} className="p-3 border rounded-md">
            <p className="font-semibold">{address.line1}</p>
            <p className="text-sm text-gray-600">{address.city}, {address.postal_code}</p>
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
