import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import { adminApi } from '../services/api';

/**
 * Normalize server response into a simple settings map:
 * - If the server returns an array of rows [{ key, value }, ...], convert to { key: value, ... }
 * - If the server returns an object (map), use it as-is.
 */
function normalizeServerSettings(resp: any) {
  if (!resp) return {};

  // If it's already an object map with keys like business_info/orders/payments/delivery
  if (typeof resp === 'object' && !Array.isArray(resp)) {
    return resp;
  }

  // If it's an array of rows: [{ key, value, ... }, ...]
  if (Array.isArray(resp)) {
    const map: Record<string, any> = {};
    for (const r of resp) {
      if (!r) continue;
      const key = r.key;
      let val = r.value ?? {};
      // value might be a JSON string or already parsed
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) { /* ignore parse error */ }
      }
      map[key] = val ?? {};
    }
    return map;
  }

  return {};
}

/**
 * Ensure the settings object has the expected top-level keys so component
 * can safely read nested props without checks everywhere.
 */
function ensureSettingsShape(s: any) {
  return {
    business_info: { name: '', address: '', phone: '', email: '', ...(s?.business_info ?? {}) },
    orders: {
      tax_gst_enabled: false,
      tax_gst_percentage: 0,
      service_charge_enabled: false,
      service_charge_percentage: 0,
      service_charge_value: 0,
      minimum_order_amount: 0,
      ...(s?.orders ?? {}),
    },
    payments: {
      cash_enabled: false,
      upi_enabled: false,
      card_enabled: false,
      default_payment_method: 'cash',
      ...(s?.payments ?? {}),
    },
    delivery: {
      delivery_radius: 0,
      delivery_fee: 0,
      free_delivery_threshold: 0,
      ...(s?.delivery ?? {}),
    },
    ...s,
  };
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<any>(() => ensureSettingsShape({}));
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getSettings()
      .then((resp: any) => {
        if (!mounted) return;
        const normalized = normalizeServerSettings(resp);
        setSettings(ensureSettingsShape(normalized));
      })
      .catch((err: any) => {
        console.error('getSettings failed', err);
        // keep defaults but notify
        setNotification({ type: 'error', message: 'Failed to load settings.' });
        setTimeout(() => setNotification(null), 3000);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const handleChange = (section: string, key: string, value: any) => {
    setSettings((prev: any) => {
      const next = {
        ...prev,
        [section]: {
          ...(prev?.[section] ?? {}),
          [key]: value,
        },
      };
      return ensureSettingsShape(next);
    });
  };

  const handleSave = async () => {
    try {
      // Send normalized settings object to the API.
      // adminApi.updateSettings should accept a map { business_info: {...}, orders: {...}, ... }
      await adminApi.updateSettings(settings);
      setNotification({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      console.error('updateSettings error', error);
      setNotification({ type: 'error', message: 'Failed to save settings.' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return <AdminShell><div>Loading...</div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>

        {notification && (
          <div className={`p-4 mb-4 text-white rounded ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
          </div>
        )}

        <div className="space-y-8">
          {/* Business Info */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Business Info</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Store/Brand Name</label>
                <input
                  type="text"
                  id="name"
                  value={settings.business_info.name ?? ''}
                  onChange={(e) => handleChange('business_info', 'name', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  id="address"
                  value={settings.business_info.address ?? ''}
                  onChange={(e) => handleChange('business_info', 'address', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="text"
                  id="phone"
                  value={settings.business_info.phone ?? ''}
                  onChange={(e) => handleChange('business_info', 'phone', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  id="email"
                  value={settings.business_info.email ?? ''}
                  onChange={(e) => handleChange('business_info', 'email', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Orders / Checkout Defaults */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Orders / Checkout Defaults</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  id="tax_gst_enabled"
                  type="checkbox"
                  checked={Boolean(settings.orders.tax_gst_enabled)}
                  onChange={(e) => handleChange('orders', 'tax_gst_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="tax_gst_enabled" className="ml-3 block text-sm font-medium text-gray-700">Enable Tax/GST</label>
                <input
                  type="number"
                  value={Number(settings.orders.tax_gst_percentage ?? 0)}
                  onChange={(e) => handleChange('orders', 'tax_gst_percentage', parseFloat(e.target.value || '0'))}
                  className="ml-4 w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <span className="ml-2">%</span>
              </div>
              <div className="flex items-center">
                <input
                  id="service_charge_enabled"
                  type="checkbox"
                  checked={Boolean(settings.orders.service_charge_enabled)}
                  onChange={(e) => handleChange('orders', 'service_charge_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="service_charge_enabled" className="ml-3 block text-sm font-medium text-gray-700">Enable Service Charge</label>
                <input
                  type="number"
                  value={Number(settings.orders.service_charge_percentage ?? 0)}
                  onChange={(e) => handleChange('orders', 'service_charge_percentage', parseFloat(e.target.value || '0'))}
                  className="ml-4 w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <span className="ml-2">%</span>
                <input
                  type="number"
                  value={Number(settings.orders.service_charge_value ?? 0)}
                  onChange={(e) => handleChange('orders', 'service_charge_value', parseFloat(e.target.value || '0'))}
                  className="ml-4 w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <span className="ml-2">(value)</span>
              </div>
              <div>
                <label htmlFor="minimum_order_amount" className="block text-sm font-medium text-gray-700">Minimum Order Amount</label>
                <input
                  type="number"
                  id="minimum_order_amount"
                  value={Number(settings.orders.minimum_order_amount ?? 0)}
                  onChange={(e) => handleChange('orders', 'minimum_order_amount', parseFloat(e.target.value || '0'))}
                  className="mt-1 w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payments */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Payments</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  id="cash_enabled"
                  type="checkbox"
                  checked={Boolean(settings.payments.cash_enabled)}
                  onChange={(e) => handleChange('payments', 'cash_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="cash_enabled" className="ml-3 block text-sm font-medium text-gray-700">Cash</label>
              </div>
              <div className="flex items-center">
                <input
                  id="upi_enabled"
                  type="checkbox"
                  checked={Boolean(settings.payments.upi_enabled)}
                  onChange={(e) => handleChange('payments', 'upi_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="upi_enabled" className="ml-3 block text-sm font-medium text-gray-700">UPI</label>
              </div>
              <div className="flex items-center">
                <input
                  id="card_enabled"
                  type="checkbox"
                  checked={Boolean(settings.payments.card_enabled)}
                  onChange={(e) => handleChange('payments', 'card_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="card_enabled" className="ml-3 block text-sm font-medium text-gray-700">Card</label>
              </div>
              <div>
                <label htmlFor="default_payment_method" className="block text-sm font-medium text-gray-700">Default Payment Method</label>
                <select
                  id="default_payment_method"
                  value={settings.payments.default_payment_method ?? 'cash'}
                  onChange={(e) => handleChange('payments', 'default_payment_method', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="cash">cash</option>
                  <option value="upi">upi</option>
                  <option value="card">card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Delivery</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="delivery_radius" className="block text-sm font-medium text-gray-700">Delivery Radius (km)</label>
                <input
                  type="number"
                  id="delivery_radius"
                  value={Number(settings.delivery.delivery_radius ?? 0)}
                  onChange={(e) => handleChange('delivery', 'delivery_radius', parseFloat(e.target.value || '0'))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700">Delivery Fee (flat)</label>
                <input
                  type="number"
                  id="delivery_fee"
                  value={Number(settings.delivery.delivery_fee ?? 0)}
                  onChange={(e) => handleChange('delivery', 'delivery_fee', parseFloat(e.target.value || '0'))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="free_delivery_threshold" className="block text-sm font-medium text-gray-700">Free Delivery Threshold</label>
                <input
                  type="number"
                  id="free_delivery_threshold"
                  value={Number(settings.delivery.free_delivery_threshold ?? 0)}
                  onChange={(e) => handleChange('delivery', 'free_delivery_threshold', parseFloat(e.target.value || '0'))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-5">
          <div className="flex justify-end">
            <button type="button" onClick={handleSave} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Save
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminSettingsPage;
