
import React, { useState } from 'react';
import { useCartStore } from '@/hooks/useCartStore';
import { Link, useLocation } from 'wouter';

export function Checkout() {
  const { items, coupon, clearCart } = useCartStore();
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const discount = coupon ? (coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value) : 0;
  const taxableAmount = subtotal - discount;
  const gst = taxableAmount * 0.05;
  const deliveryCharge = 0;
  const total = taxableAmount + gst + deliveryCharge;

  const handlePlaceOrder = async () => {
    const orderDetails = {
      items,
      customer,
      totals: { subtotal, discount, taxableAmount, gst, deliveryCharge, total },
    };

    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderDetails),
    });

    const { orderId } = await response.json();

    // Stubbed payment flow
    const paymentSuccess = await new Promise(resolve => setTimeout(() => resolve(true), 2000));

    if (paymentSuccess) {
      await fetch(`/api/orders/${orderId}/mark-paid`, { method: 'POST' });
      clearCart();
      setLocation(`/confirmation?orderId=${orderId}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/cart">
          <a className="flex items-center text-brand-teak hover:underline">
            &larr; Back to Cart
          </a>
        </Link>
        <h1 className="font-bold text-xl text-center -mt-6">Checkout</h1>
      </div>

      <div className="p-4">
        {/* Cart Summary */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
          <div className="divide-y divide-gray-200">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold">{item.name} (x{item.quantity})</p>
                </div>
                <p>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>₹{subtotal.toFixed(2)}</p>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-500">
                <p>Discount</p>
                <p>- ₹{discount.toFixed(2)}</p>
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
        </div>

        {/* Delivery/Table Info */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Details</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Your Name" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Phone Number" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Delivery Address or Table Number" value={customer.address} onChange={(e) => setCustomer({...customer, address: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        {/* Payment Options */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">Payment</h2>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 rounded-md">
              <input type="radio" name="payment" value="cod" className="mr-2" defaultChecked />
              Cash on Delivery
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-md">
              <input type="radio" name="payment" value="pay_at_counter" className="mr-2" />
              Pay at Counter
            </label>
          </div>
        </div>

        {/* Place Order Button */}
        <button 
          onClick={handlePlaceOrder}
          className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
