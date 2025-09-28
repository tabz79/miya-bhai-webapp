import React, { useState } from 'react';
import { useCartStore } from '@/hooks/useCartStore';
import { Link, useLocation } from 'wouter';

export function Checkout() {
  const { items, coupon, clearCart } = useCartStore();
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [authChoice, setAuthChoice] = useState(''); // 'guest' or 'login'
  const [error, setError] = useState('');

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value) : 0;
  const taxableAmount = subtotal - discount;
  const gst = taxableAmount * 0.05;
  const deliveryCharge = 0;
  const total = taxableAmount + gst + deliveryCharge;

  const validate = () => {
    if (!customer.phone || !customer.email) {
      setError('Phone and Email are required.');
      return false;
    }
    setError('');
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    const orderDetails = {
      items,
      customer,
      totals: { subtotal, discount, taxableAmount, gst, deliveryCharge, total },
      payment_method: 'COD',
    };

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderDetails),
    });

    const responseBody = await response.text();
    let result;
    try {
      result = JSON.parse(responseBody);
    } catch (e) {
      setError('Invalid or empty response from server');
      return;
    }

    if (response.ok) {
      clearCart();
      setLocation(`/confirmation?orderId=${result.orderId}`);
    } else {
      setError(result.error || 'Failed to place order.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground">
      <div className="p-4 border-b border-gray-200">
        <Link href="/cart" className="flex items-center text-brand-teak hover:underline">&larr; Back to Cart</Link>
        <h1 className="font-bold text-xl text-center -mt-6">Checkout</h1>
      </div>

      <div className="p-4">
        {!authChoice ? (
          <div className="text-center">
            <h2 className="font-semibold text-lg mb-4">How would you like to proceed?</h2>
            <button onClick={() => setAuthChoice('guest')} className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold mb-4">Continue as Guest</button>
            <button onClick={() => setAuthChoice('login')} className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold">Login</button>
          </div>
        ) : (
          <>
            {/* Cart Summary */}
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
              {/* ... same as before ... */}
            </div>

            {/* Guest Details */}
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">Your Details</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Your Name (Optional)" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                <input type="email" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" required />
                <input type="tel" placeholder="Phone Number" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Delivery Address or Table Number" value={customer.address} onChange={(e) => setCustomer({...customer, address: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            {/* Payment Options */}
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">Payment Method</h2>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-md bg-gray-100">
                  <input type="radio" name="payment" value="cod" className="mr-2" defaultChecked disabled />
                  Cash on Delivery (COD)
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button onClick={handlePlaceOrder} className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors">
              Place Order
            </button>
          </>
        )}
      </div>
    </div>
  );
}