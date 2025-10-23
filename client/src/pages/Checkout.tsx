import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/hooks/useCartStore';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export function Checkout() {
  const { items, coupon: cartCoupon, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [customer, setCustomer] = useState({ name: user?.user_metadata?.full_name ?? '', phone: '', email: user?.email ?? '' });
  const [authChoice, setAuthChoice] = useState(''); // 'guest' or 'login'
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [pincode, setPincode] = useState('');
  const [pincodeValid, setPincodeValid] = useState(false);
  const [location, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.getPublicSettings().then(setSettings).catch(() => {});
    if (user) {
      setAuthChoice('login');
      // Pre-fill from the user object from AuthContext
      setCustomer(c => ({ ...c, name: user.user_metadata?.full_name || c.name, phone: user.phone || c.phone, email: user.email || c.email }));
      const savedAddress = user.addresses?.[0];
      if (savedAddress) {
        setAddress(savedAddress.line1 || '');
        setPincode(savedAddress.postal_code || '');
        if (settings?.delivery?.allowed_pincodes) {
          const isValid = settings.delivery.allowed_pincodes.includes(savedAddress.postal_code);
          setPincodeValid(isValid);
        }
      }
    }
  }, [user, settings?.delivery?.allowed_pincodes]);

  // If cart already has a coupon (you pasted it in the cart), prefer that
  useEffect(() => {
    if (cartCoupon) {
      // cartCoupon might be an object or a code string depending on store implementation
      if (typeof cartCoupon === 'string') {
        setCouponCode(cartCoupon);
        // attempt to validate and populate appliedCoupon
        (async () => {
          try {
            const validated = await api.validateCoupon(cartCoupon);
            setAppliedCoupon(validated);
            setCouponError('');
          } catch {
            setAppliedCoupon(null);
          }
        })();
      } else if (typeof cartCoupon === 'object' && cartCoupon?.code) {
        setAppliedCoupon(cartCoupon);
        // <-- fixed: use cartCoupon.code (not an undefined "coupon" variable)
        setCouponCode(cartCoupon.code);
      }
    }
  }, [cartCoupon]);

  // prefer coupon from cart first (object), otherwise local appliedCoupon
  const activeCoupon = (typeof cartCoupon === 'object' && cartCoupon?.code)
    ? cartCoupon
    : appliedCoupon;

  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const discount = activeCoupon
    ? (activeCoupon.type === 'percentage' ? subtotal * (Number(activeCoupon.value) / 100) : Number(activeCoupon.value))
    : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = taxableAmount * 0.05;
  const deliveryCharge = 0;
  const total = taxableAmount + gst + deliveryCharge;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplying(true);
    try {
      const validatedCoupon = await api.validateCoupon(couponCode);
      setAppliedCoupon(validatedCoupon);
      setCouponError('');
      // Optionally persist into cart store if you have a setter:
      // useCartStore.getState().setCoupon?.(validatedCoupon);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  const validateForm = () => {
    if (!customer.phone || !customer.email) {
      setError('Phone and Email are required.');
      return false;
    }
    if (pincodeValid && (!address || !location)) {
      setError('Please provide a delivery address and capture your location.');
      return false;
    }
    setError('');
    return true;
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPincode = e.target.value;
    setPincode(newPincode);
    const isValid = settings?.delivery?.allowed_pincodes?.includes(newPincode);
    setPincodeValid(isValid);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeliveryLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setError('Could not get your location. Please enter your address manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    // If user is logged in, save their details for next time
    if (user) {
      // We can make these calls in parallel and not block the order
      Promise.allSettled([
        api.updateUserProfile({ 
          full_name: customer.name, 
          phone: customer.phone 
        }),
        api.updateUserProfileAddress({ 
          line1: address, 
          postal_code: pincode 
        })
      ]).then(results => {
        results.forEach(result => {
          if (result.status === 'rejected') {
            console.warn('Failed to save user details:', result.reason);
          }
        });
      });
    }

    const rawCoupon = (typeof cartCoupon === 'string' && cartCoupon)
      ? cartCoupon
      : (activeCoupon?.code ?? null);

    const couponCodeToSend = rawCoupon ? String(rawCoupon).toUpperCase() : null;

    const orderDetails = {
      items,
      customer,
      totals: { subtotal, discount, taxableAmount, gst, deliveryCharge, total },
      discount_amount: Number(discount),
      payable_amount: Number(total),
      payment_method: 'COD',
      pincode,
      delivery_address: address,
      delivery_lat: location?.lat,
      delivery_lng: location?.lng,
      coupon_code: couponCodeToSend,
    };

    try {
      const result = await api.createOrder(orderDetails);
      clearCart();
      navigate(`/confirmation?orderId=${result.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Network error while placing order.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground">
      <div className="p-4 border-b border-gray-200">
        <Link to="/cart" className="flex items-center text-brand-teak hover:underline">&larr; Back to Cart</Link>
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
              {/* You probably have your cart summary component/render here — keep it */}
              <div className="p-4 border rounded-md">
                <div className="flex justify-between">
                  <div>Subtotal</div>
                  <div>{subtotal.toFixed(2)}</div>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <div>Coupon ({activeCoupon?.code})</div>
                      <div>-{discount.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between font-semibold mt-2">
                      <div>Payable</div>
                      <div>{total.toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Guest Details */}
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">Your Details</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Your Name (Optional)" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
                <input type="email" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" required />
                <input type="tel" placeholder="Phone Number" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" required />
                <input type="text" placeholder="Pincode" value={pincode} onChange={handlePincodeChange} className="w-full p-2 border border-gray-300 rounded-md" />
                {pincode && !pincodeValid && <p className="text-red-500 text-sm">{"We don’t deliver to this pincode yet"}</p>}
                {pincodeValid && (
                  <>
                    <input type="text" placeholder="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                    <button onClick={handleGetLocation} className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold">Get Current Location</button>
                    {location && <p className="text-green-500 text-sm">Location captured: {location.lat}, {location.lng}</p>}
                  </>
                )}
              </div>
            </div>

            {/* Coupon Code: hide if coupon already present in cart or applied */}
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">Coupon Code</h2>
              {!cartCoupon && !appliedCoupon ? (
                <div className="flex items-center space-x-2">
                  <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                  <button onClick={handleApplyCoupon} disabled={applying} className="bg-brand-teak text-white px-6 py-2 rounded-lg font-semibold">
                    {applying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="p-3 border rounded-md bg-green-50">
                  <div className="font-medium">Coupon applied: { (typeof cartCoupon === 'string') ? (appliedCoupon?.code ?? cartCoupon) : (cartCoupon?.code ?? appliedCoupon?.code) }</div>
                  <div className="text-sm text-gray-600">Discount: {discount.toFixed(2)}</div>
                </div>
              )}
              {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
              {/* show friendly applied message */}
              {!cartCoupon && appliedCoupon && <p className="text-green-500 text-sm mt-2">Coupon "{appliedCoupon.code}" applied!</p>}
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
