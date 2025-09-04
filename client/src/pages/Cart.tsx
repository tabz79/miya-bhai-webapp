import React from 'react';
import { BottomNav } from '../components/BottomNav';

export function Cart() {
  return (
    <div className="w-full min-h-screen bg-app-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-app-foreground font-bold text-xl">Your Cart</h1>
      </div>

      {/* Empty cart state */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-gray-400 text-6xl mb-4">🛒</div>
        <h2 className="text-app-foreground font-semibold text-lg mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Add some delicious items from our menu to get started!
        </p>
        <button className="bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors">
          Browse Menu
        </button>
      </div>

      {/* Future cart items would go here */}
      {/* 
      <div className="p-4">
        Line items, qty control, subtotal, taxes, total, checkout CTA
      </div>
      */}

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}