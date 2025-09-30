// client/src/admin/components/OrderDetailsSlideOver.tsx
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../admin/services/api'; // adjust path if needed
import type { Driver } from '../../admin/types'; // driver type from your types file

// ADMIN PANEL — DESKTOP-FIRST ONLY
// Slide-over for order details. Backend calls go through adminApi (client/src/admin/services/api.ts)
// TODO: Wire real admin auth token and pass it into service calls (do not store secrets in client).

type Order = {
  id: string;
  order_id?: string;
  status?: string;
  total?: number;
  created_at?: string;
  assigned_to?: string | null;
  customer_details?: { name?: string; phone?: string; address?: string };
  items?: any[];
};

const statusOptionsDisplay = [
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const normalizeDisplayStatus = (s?: string) => {
  if (!s) return 'UNKNOWN';
  const map: Record<string, string> = {
    Pending: 'PENDING',
    Accepted: 'ACCEPTED',
    Preparing: 'PREPARING',
    'Out for Delivery': 'OUT_FOR_DELIVERY',
    Completed: 'COMPLETED',
    Cancelled: 'CANCELLED',
  };
  return map[s] ?? s.toUpperCase();
};

const humanizeStatus = (s?: string) => {
  if (!s) return '—';
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

/* Helpers to compute/format prices robustly */
function getItemPrice(item: any): number {
  // prefer explicit line total fields
  const direct =
    (item && (item.line_total ?? item.total ?? item.amount ?? item.price ?? item.rate ?? item.unit_price)) ?? null;
  if (typeof direct === 'number' && Number.isFinite(direct)) {
    // If this looks like a per-line total (e.g. already multiplied by qty) accept it.
    return direct;
  }

  // Sometimes price fields are strings — coerce to number
  const maybeNum = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const qty = maybeNum(item?.qty ?? item?.quantity ?? item?.count ?? 1) ?? 1;
  const unit = maybeNum(item?.rate ?? item?.price ?? item?.unit_price ?? 0) ?? 0;

  // If item has nested price object
  if (item?.price && typeof item.price === 'object') {
    const nested = maybeNum(item.price.value ?? item.price.amount ?? item.price.total);
    if (nested !== null) return nested;
  }

  // fallback to qty * unit
  return qty * unit;
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '₹0.00';
  return '₹' + value.toFixed(2);
}

const OrderDetailsSlideOver: React.FC<{ order: Order; isOpen: boolean; onClose: () => void }> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | ''>(order?.assigned_to ?? '');
  const [selectedStatus, setSelectedStatus] = useState<string>(normalizeDisplayStatus(order?.status));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with real admin token logic when available
  const adminToken: string | undefined = undefined;

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function loadDrivers() {
      setLoadingDrivers(true);
      setError(null);
      try {
        // prefer adminApi to keep single service surface
        const resp = await adminApi.getDrivers?.(); // adminApi.getDrivers returns Driver[] or null
        // normalize: adminApi.getDrivers returns array or {data: []}
        const list: Driver[] = Array.isArray(resp) ? resp : (resp?.data ?? resp ?? []);
        if (!mounted) return;
        setDrivers(list);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load drivers');
        setDrivers([]);
      } finally {
        if (!mounted) return;
        setLoadingDrivers(false);
      }
    }
    loadDrivers();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    // keep selected values in sync if the parent order changes
    setSelectedDriver(order?.assigned_to ?? '');
    setSelectedStatus(normalizeDisplayStatus(order?.status));
    setMessage(null);
    setError(null);
  }, [order]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedDriver) {
      setMessage('Please select a driver to assign.');
      return;
    }
    setAssigning(true);
    setError(null);
    setMessage(null);
    try {
      // call adminApi.assignDriverToOrder — normalized in services
      await adminApi.assignDriverToOrder(order.id, selectedDriver);
      setMessage('Driver assigned.');
      // quick refresh to reflect change
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) {
      // try to show useful server message
      setError(err?.message || String(err) || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedStatus) {
      setMessage('Please select a status.');
      return;
    }
    setUpdatingStatus(true);
    setError(null);
    setMessage(null);
    try {
      await adminApi.updateOrderStatus(order.id, selectedStatus);
      setMessage(`Status updated to ${humanizeStatus(selectedStatus)}.`);
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) {
      setError(err?.message || String(err) || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Cancel this order? This action cannot be undone.')) return;
    setUpdatingStatus(true);
    setError(null);
    setMessage(null);
    try {
      await adminApi.updateOrderStatus(order.id, 'CANCELLED');
      setMessage('Order cancelled.');
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) {
      setError(err?.message || String(err) || 'Failed to cancel order');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full divide-y divide-gray-200 flex flex-col bg-white shadow-xl">
              <div className="flex-1 h-0 overflow-y-auto">
                <header className="px-4 py-6 sm:px-6 bg-[#3c3c3b] text-white">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium">
                      Order {order.order_id ?? `#${order.id?.slice?.(0, 8) ?? ''}`}
                    </h2>
                    <div className="ml-3 h-7 flex items-center">
                      <button
                        onClick={onClose}
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </header>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="px-4 divide-y divide-gray-200 sm:px-6">
                    {/* Order details */}
                    <div className="py-6">
                      <p><strong>Customer:</strong> {order.customer_details?.name ?? order.customer_details?.phone ?? '—'}</p>
                      <p><strong>Date:</strong> {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</p>
                      <p><strong>Status:</strong> {humanizeStatus(order.status)}</p>
                      <p><strong>Total:</strong> {formatCurrency(order.total ?? 0)}</p>
                    </div>

                    {/* Order items */}
                    <div className="py-6">
                      <h3 className="font-medium text-gray-900">Items</h3>
                      {order.items && order.items.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {order.items.map((it: any, idx: number) => {
                            const qty = Number(it.qty ?? it.quantity ?? 1) || 1;
                            const linePrice = getItemPrice(it);
                            return (
                              <li key={idx} className="text-sm flex justify-between">
                                <span>{qty} × {it.name ?? it.title ?? it.sku ?? 'Item'}</span>
                                <span>{formatCurrency(linePrice)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">No items available in order details.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 px-4 py-4 flex justify-end space-x-3 items-center">
                {message && <div className="text-sm text-green-700">{message}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex items-center space-x-2">
                  {/* Driver assign */}
                  <div>
                    <label className="sr-only">Assign Driver</label>
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      disabled={loadingDrivers || assigning}
                      className="border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Assign Driver</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d['isActive'] === false || d.status === 'inactive' ? '(inactive)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAssign}
                    disabled={assigning || !selectedDriver}
                    className="bg-[#ae905c] text-white px-3 py-2 rounded disabled:opacity-50"
                  >
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="sr-only">Change Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">{humanizeStatus(order.status)}</option>
                    {statusOptionsDisplay.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleChangeStatus}
                    disabled={updatingStatus || !selectedStatus}
                    className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating…' : 'Change Status'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderDetailsSlideOver;
