
import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { useCartStore } from '@/hooks/useCartStore';
import { Link } from 'wouter';
import { Trash2 } from 'lucide-react';

import { api } from '@/services/api';

interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
}

export function Cart() {
  const { items, removeFromCart, addToCart, clearCart, coupon, applyCoupon, decreaseQuantity, removeCoupon } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await api.getCoupons();
        setCoupons(data || []);
      } catch (err) {
        console.error('Failed to fetch coupons', err);
      }
    };
    fetchCoupons();
  }, []);

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value) : 0;
  const taxableAmount = subtotal - discount;
  const gst = taxableAmount * 0.05;
  const deliveryCharge = 0;
  const total = taxableAmount + gst + deliveryCharge;

  const handleApplyCoupon = () => {
    setError('');
    const foundCoupon = coupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());

    if (!foundCoupon) {
      setError('Invalid coupon code');
      return;
    }

    if (!foundCoupon.is_active) {
      setError('This coupon is not active');
      return;
    }

    if (foundCoupon.expires_at && new Date(foundCoupon.expires_at) < new Date()) {
      setError('This coupon has expired');
      return;
    }

    if (foundCoupon.max_uses && foundCoupon.uses_count >= foundCoupon.max_uses) {
      setError('This coupon has reached its usage limit');
      return;
    }

    applyCoupon(foundCoupon);
  };

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="font-bold text-xl">Your Cart</h1>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h2 className="font-semibold text-lg mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Add some delicious items from our menu to get started!
          </p>
          <Link href="/menu" className="bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors">
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          <div className="p-4 divide-y divide-gray-200">
            {items.map(item => (
              <div key={item.id} className="flex items-center py-4">
                <img src={item.image || '/placeholder.png'} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-500">₹{item.price?.toFixed(2)}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => addToCart(item)} className="text-green-500 font-bold text-lg w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full">
                    +
                  </button>
                  <span className="px-4 font-semibold">{item.quantity}</span>
                  <button onClick={() => decreaseQuantity(item.id)} className="text-red-500 font-bold text-lg w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full">
                    -
                  </button>
                </div>
                <div className="ml-4">
                    <p className="font-semibold">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="ml-4 text-gray-400 hover:text-red-500">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Coupon Code */}
          <div className="p-4">
            <div className="flex">
              <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-brand-teak" />
              <button onClick={handleApplyCoupon} className="bg-brand-teak text-white px-4 rounded-r-md font-semibold hover:bg-brand-tobacco">Apply</button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Totals */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>₹{subtotal.toFixed(2)}</p>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-green-500">
                <p>Discount ({coupon?.code})</p>
                <div className="flex items-center">
                  <p className="mr-2">- ₹{discount.toFixed(2)}</p>
                  <button onClick={removeCoupon} className="text-red-500 hover:underline text-sm">Remove</button>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <p>Taxable Amount</p>
              <p>₹{taxableAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>GST (5%)</p>
              <p>₹{gst.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p>Delivery Charge</p>
              <p>₹{deliveryCharge.toFixed(2)}</p>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>₹{total.toFixed(2)}</p>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-4">
            <Link href="/checkout" className="block text-center bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors w-full">
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}
