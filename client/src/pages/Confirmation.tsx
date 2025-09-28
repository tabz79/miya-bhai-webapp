
import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCartStore } from '@/hooks/useCartStore';

export function Confirmation() {
  const { clearCart } = useCartStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    clearCart();
    const timer = setTimeout(() => {
      setLocation('/');
    }, 5000); // Redirect to home after 5 seconds

    return () => clearTimeout(timer);
  }, [clearCart, setLocation]);

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground flex flex-col items-center justify-center p-8 text-center">
      <div className="text-green-500 text-6xl mb-4">✓</div>
      <h1 className="font-bold text-2xl mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-500 text-sm mb-6">
        Thank you for your order. You will be redirected to the home page shortly.
      </p>
      <Link href="/" className="bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors">
        Go to Home
      </Link>
    </div>
  );
}
