import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { useCartStore } from '@/hooks/useCartStore';
import { Link } from 'wouter';

export function Cart() {
  const { items, removeFromCart, addToCart } = useCartStore();

  const total = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

  return (
    <div className="w-full min-h-screen bg-app-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-app-foreground font-bold text-xl">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h2 className="text-app-foreground font-semibold text-lg mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Add some delicious items from our menu to get started!
          </p>
          <Link href="/menu">
            <a className="bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors">
              Browse Menu
            </a>
          </Link>
        </div>
      ) : (
        <div className="p-4">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-500">₹{item.price}</p>
              </div>
              <div className="flex items-center">
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 px-2">-</button>
                <span>{item.quantity}</span>
                <button onClick={() => addToCart(item)} className="text-green-500 px-2">+</button>
              </div>
            </div>
          ))}
          <div className="mt-4 text-right">
            <p className="font-semibold text-lg">Total: ₹{total.toFixed(2)}</p>
            <button className="bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors mt-4">
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}