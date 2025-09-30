// client/src/admin/pages/delivery.tsx
import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../components/AdminShell';
import { adminApi } from '../services/api';

type Delivery = {
  order_id: string; // UUID
  order_number: string; // Human-friendly ID
  driver_name?: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_amount: number; // amount for COD, or 0 for online paid
  total: number; // total order amount
};

const AdminDeliveryPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminApi.getDeliveries?.();
      // The API now returns the normalized Delivery[] directly
      setDeliveries(resp || []);
    } catch (err: any) {
      console.error('loadDeliveries failed', err);
      setError(err?.message ?? 'Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
    const handler = () => {
      loadDeliveries();
    };
    window.addEventListener('miya:refresh-deliveries', handler as EventListener);
    // also refresh when orders change
    window.addEventListener('miya:refresh-orders', handler as EventListener);
    return () => {
      window.removeEventListener('miya:refresh-deliveries', handler as EventListener);
      window.removeEventListener('miya:refresh-orders', handler as EventListener);
    };
  }, [loadDeliveries]);

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Delivery Assignments</h2>

        {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.length === 0 && !loading && !error && (
            <div className="text-sm text-gray-500">No deliveries found.</div>
          )}

          {deliveries.map((d) => (
            <div key={d.order_id} className="border p-4 rounded-lg">
              <p><strong>Order:</strong> {d.order_number ?? d.order_id}</p>
              <p><strong>Driver:</strong> {d.driver_name ?? '—'}</p>
              <p><strong>Status:</strong> {d.status ?? '—'}</p>

              <div className="mt-2">
                <p className="text-sm"><strong>Payment mode:</strong> {d.payment_method ?? '—'}</p>

                <p className="text-sm">
                  <strong>Payment status:</strong>{' '}
                  {d.payment_method === 'COD'
                    ? (d.payment_amount != null ? `Collect ₹${Number(d.payment_amount).toFixed(2)}` : 'Collect —')
                    : (d.payment_status ? (d.payment_status === 'PAID' ? 'Paid' : d.payment_status) : 'Pending')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDeliveryPage;
