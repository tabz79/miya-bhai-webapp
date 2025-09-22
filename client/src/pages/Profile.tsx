import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { restaurantInfo } from '../data/mockData';
import { useCartStore } from '@/hooks/useCartStore';

const user = {
  name: 'Miya Bhai',
  email: 'hello@example.com',
};

export function Profile() {
  const { clearCart } = useCartStore();

  const handleSignOut = () => {
    clearCart();
    // In a real app, you'd also redirect to a login page
    // or clear an authentication token.
    alert('You have been signed out and your cart has been cleared.');
  };

  return (
    <div className="w-full min-h-screen bg-app-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-app-foreground font-bold text-xl">Profile</h1>
      </div>

      {/* User Info Section (stub) */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-teak rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{user.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-app-foreground font-semibold text-lg">{user.name}</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Order History (stub) */}
      <div className_="p-4 border-b border-gray-200">
        <h3 className="text-app-foreground font-semibold text-base mb-2">Order History</h3>
        <p className="text-gray-500 text-sm">No orders yet. Start by placing your first order!</p>
      </div>

      {/* Sign Out Button */}
      <div className="p-4">
        <button 
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Restaurant Story - Full narrative as specified */}
      <div className="p-4">
        <h3 className="text-app-foreground font-bold text-lg mb-3">About {restaurantInfo.name}</h3>
        <div className="space-y-4 text-app-foreground text-sm leading-relaxed">
          {restaurantInfo.story.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph.trim()}</p>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-card">
          <h4 className="font-semibold text-base mb-2">Contact Us</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Phone:</span> {restaurantInfo.phone}</p>
            <p><span className="font-medium">Email:</span> {restaurantInfo.email}</p>
            <p><span className="font-medium">Address:</span> {restaurantInfo.address}</p>
          </div>
        </div>
      </div>

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}