
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export function OrdersCard() {
  const { user } = useAuth();
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => api.getUserOrders(),
    enabled: !!user, // Only fetch if user is logged in
  });

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">Log in to see your order history.</p>
        <Button className="bg-brand-teak text-white hover:bg-brand-teak/90">Login</Button>
      </div>
    );
  }

  if (isLoading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">Could not load orders.</p>;

  return (
    <div>
      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="p-2 border rounded-md">
              <div className="flex justify-between">
                <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                <p className="font-semibold">₹{order.total}</p>
              </div>
              <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          <Button variant="outline" className="w-full border-brand-teak text-brand-teak hover:bg-brand-teak/10">Load More</Button>
        </div>
      ) : (
        <p>No orders yet.</p>
      )}
    </div>
  );
}
