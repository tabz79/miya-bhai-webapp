// client/src/admin/pages/orders.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminShell from '../components/AdminShell';
import OrderDetailsSlideOver from '../components/OrderDetailsSlideOver';
import { fetchOrders, adminApi } from '../services/api'; // <-- service layer (adminApi used for numeric signature)

// Use the shared singleton supabase client to avoid multiple GoTrue instances
import supabase from '../../lib/supabaseClient';

type Order = {
  id: string;
  order_id?: string;
  status: 'NEW' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED' | 'UNKNOWN';
  total: number;
  created_at: string;
  assigned_to?: string | null;
  customer_details?: { name?: string; phone?: string };
  customer_name?: string | null;
  customers?: { name?: string } | null;
  items?: any[];
};

const ORDERS_PER_PAGE = 10;

const statusOptions = [
  { value: 'All', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'NEW':
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
    case 'PREPARING':
      return 'bg-blue-100 text-blue-800';
    case 'OUT_FOR_DELIVERY':
      return 'bg-indigo-100 text-indigo-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);

  // server-side pagination/filtering/searching
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'All' ? '' : statusFilter;

      const resp = await adminApi.getOrders(
        currentPage,
        ORDERS_PER_PAGE,
        { status: statusParam, search: searchQuery }
      );

      const data = (resp && (resp.items || resp.data || resp.orders)) || [];
      const meta = (resp && resp.meta) || { total: data.length, page: currentPage, limit: ORDERS_PER_PAGE };

      const rows = (data || []).slice().sort((a: Order, b: Order) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setOrders(rows);
      const total = meta?.total ?? rows.length;
      setTotalPages(Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)));
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
      // The backend now handles authentication via Supabase, so no client-side token removal needed here.
      // If unauthorized, the backend will return a 401, which the frontend should handle via global auth context.
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery]);

  useEffect(() => {
    // TODO: Implement proper admin authentication flow.
    // Client-side password prompt removed.
    loadOrders();
  }, [loadOrders]);

  // This effect re-runs the loadOrders call whenever the page, or filters change.
  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter, searchQuery, loadOrders]);


  // ---------------------------
  // Supabase realtime subscription (replaces polling)
  // ---------------------------
  const subscriptionRef = useRef<any | null>(null);

  useEffect(() => {
    const subscribe = () => {
      if (subscriptionRef.current) return;
      if (!supabase) {
        console.warn('Supabase client not initialized. Cannot subscribe.');
        return;
      }
      try {
        const channel = supabase
          .channel('public:orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
            // simple safe behavior: refetch current page; keep for cases where payload isn't aligned with client filters
            loadOrders();
          })
          .subscribe();
        subscriptionRef.current = channel;
      } catch (e) {
        console.warn('Supabase subscribe failed', e);
      }
    };

    const unsubscribe = () => {
      try {
        if (subscriptionRef.current && supabase) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      } catch (e) {
        console.warn('Supabase unsubscribe failed', e);
      }
    };

    if (document.visibilityState === 'visible') {
      subscribe();
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        unsubscribe();
      } else {
        subscribe();
        loadOrders();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      try {
        if (subscriptionRef.current && supabase) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, [loadOrders]);

  // ---------------------------
  // DOM event listeners for slide-over / other components
  // ---------------------------
  useEffect(() => {
    const onOrderUpdated = (ev: Event) => {
      // CustomEvent detail may contain: { orderId, status, assigned_to, ... }
      const e = ev as CustomEvent<Record<string, any>>;
      const detail = e?.detail ?? {};
      const orderId = detail?.orderId ?? detail?.id;

      // If no orderId present, do a safe full refresh
      if (!orderId) {
        loadOrders();
        return;
      }

      // Try to reconcile the change into local state for snappy UI updates
      const updatedFields: Partial<Order> = {};
      if (detail.status) updatedFields.status = detail.status;
      if (detail.assigned_to !== undefined) updatedFields.assigned_to = detail.assigned_to;
      // If the event carried an updated order object, prefer it
      const newOrderObj = detail.order;

      setOrders((prev) => {
        let found = false;
        const next = prev.map((o) => {
          if (String(o.id) === String(orderId)) {
            found = true;
            // If full order provided, merge it; otherwise merge updatedFields defensively
            return {
              ...o,
              ...(newOrderObj ? newOrderObj : updatedFields),
            } as Order;
          }
          return o;
        });
        // if order not found but we got a newOrderObj and it matches current filters, insert it
        if (!found && newOrderObj) {
          // naive insert at top — server pagination might later remove it; safe for immediate UI
          return [newOrderObj as Order, ...next];
        }
        // if not found and no details to apply, fallback to refetch
        if (!found && !newOrderObj && Object.keys(updatedFields).length === 0) {
          // trigger load async (do not block)
          loadOrders();
          return prev;
        }
        return next;
      });

      // Update slide-over if it's open and showing this order
      setSelectedOrder((cur) => {
        if (!cur) return cur;
        if (String(cur.id) === String(orderId)) {
          // merge
          return {
            ...cur,
            ...(newOrderObj ? newOrderObj : updatedFields),
          } as Order;
        }
        return cur;
      });
    };

    const onRefreshOrders = () => {
      loadOrders();
    };

    window.addEventListener('miya:order-updated', onOrderUpdated as EventListener);
    window.addEventListener('miya:refresh-orders', onRefreshOrders as EventListener);

    return () => {
      window.removeEventListener('miya:order-updated', onOrderUpdated as EventListener);
      window.removeEventListener('miya:refresh-orders', onRefreshOrders as EventListener);
    };
  }, [loadOrders]);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setSlideOverOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // effect will trigger load
  };

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Orders</h2>

          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-3">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border rounded-md"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <input
              aria-label="Search orders"
              placeholder="Search order id, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />

            <button type="submit" className="px-4 py-2 rounded bg-[#ae905c] text-white">
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2">Order ID</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-gray-500">Loading orders…</td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-red-600">Error: {error}</td>
                </tr>
              )}

              {!loading && orders.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-gray-500">No orders found.</td>
                </tr>
              )}

              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleRowClick(o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRowClick(o); }}
                >
                  <td className="p-2">{o.order_id ?? `#${String(o.id).slice(0, 8)}`}</td>
                  <td className="p-2">{o.customer_details?.name ?? o.customer_name ?? o.customers?.name ?? '—'}</td>
                  <td className="p-2">{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                  <td className="p-2">
                    <span className={`py-1 px-3 rounded-full text-xs ${statusBadgeClass(o.status ?? 'UNKNOWN')}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-2 text-right">₹{(o.total ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="space-x-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsSlideOver
          order={selectedOrder}
          isOpen={isSlideOverOpen}
          onClose={() => setSlideOverOpen(false)}
        />
      )}
    </AdminShell>
  );
};

export default AdminOrdersPage;
