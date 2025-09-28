import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminShell from '../components/AdminShell';
import OrderDetailsSlideOver from '../components/OrderDetailsSlideOver';
import { fetchOrders } from '../services/api'; // <-- service layer

// TODO: Use admin auth token (keep in memory or secure cookie). Pass token to service calls as needed.
type Order = {
  id: string;
  order_id?: string;
  status: 'NEW' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED' | 'UNKNOWN';
  total: number;
  created_at: string;
  assigned_to?: string | null;
  customer_details?: { name?: string; phone?: string };
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

  // NOTE: If you have an admin token, pass it here (do not store long-lived tokens in localStorage).
  const adminToken: string | undefined = undefined; // TODO: wire real token

  // Manual load function (used for initial load / user-triggered loads)
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === 'All' ? '' : statusFilter;
      const resp = await fetchOrders(
        { page: currentPage, limit: ORDERS_PER_PAGE, status: statusParam, search: searchQuery },
        adminToken
      );
      const data = (resp && (resp.data || resp.orders)) || [];
      const meta = (resp && resp.meta) || { total: data.length, page: currentPage, limit: ORDERS_PER_PAGE };

      // Defensive: ensure newest-first ordering client-side (server should ideally order)
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
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, adminToken]);

  // Initial load + whenever filters/pagination change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Robust polling effect
  const pollRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAndSet = async (signal?: AbortSignal) => {
      if (!mounted) return;
      setError(null);
      try {
        const statusParam = statusFilter === 'All' ? '' : statusFilter;
        const resp = await fetchOrders(
          { page: currentPage, limit: ORDERS_PER_PAGE, status: statusParam, search: searchQuery },
          adminToken,
          signal
        );
        if (!mounted) return;

        const data = (resp && (resp.data || resp.orders)) || [];
        // newest-first
        const rows = (data || []).slice().sort((a: Order, b: Order) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });

        setOrders(rows);
        const total = resp.meta?.total ?? rows.length;
        setTotalPages(Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)));
      } catch (err: any) {
        // Ignore aborts; set error for others
        if (err && err.name === 'AbortError') {
          // aborted
        } else {
          console.warn('[polling] fetch error', err);
          if (mounted) setError(err?.message || 'Failed to poll orders');
        }
      }
    };

    // ensure no duplicate intervals
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    // Start an immediate poll (non-blocking)
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    fetchAndSet(controllerRef.current.signal);

    const startPolling = () => {
      // guard again
      if (pollRef.current) return;
      const id = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          // abort previous request to avoid piling up
          if (controllerRef.current) {
            try { controllerRef.current.abort(); } catch (e) {}
          }
          controllerRef.current = new AbortController();
          fetchAndSet(controllerRef.current.signal);
        }
      }, 5000); // 5s default
      pollRef.current = id;
    };

    // Begin polling if page visible
    if (document.visibilityState === 'visible') startPolling();

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // stop polling and abort inflight
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (controllerRef.current) {
          try { controllerRef.current.abort(); } catch (e) {}
          controllerRef.current = null;
        }
      } else {
        // resume polling
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      // cleanup interval and inflight controller
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch (e) {}
        controllerRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentPage, statusFilter, searchQuery, adminToken]);

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
                  <td className="p-2">{o.customer_details?.name ?? '—'}</td>
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

        {/* Pagination controls */}
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
