// client/src/admin/services/api.ts
import { Order, Driver, Customer, Summary, ChartData } from '../types';

type OrdersResp = { items: Order[]; meta: { total: number; page: number; limit: number }; raw?: any };

// tiny helper to centralize fetch + error parsing
async function safeFetch(input: RequestInfo, init?: RequestInit) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = typeof input === 'string' ? (input.startsWith('http') ? input : `${baseUrl}${input}`) : input;

  const res = await fetch(url, init);
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

  if (!res.ok) {
    // Prefer server-provided message fields if available
    const serverMsg = json?.message ?? json?.error ?? (typeof text === 'string' ? text : null);
    const msg = serverMsg ? `HTTP ${res.status} — ${serverMsg}` : `HTTP ${res.status}`;
    const err = new Error(msg);
    // attach raw response for debugging
    (err as any).raw = json ?? text;
    throw err;
  }

  return { res, json, text };
}

export const adminApi = {
  getSummary: async (token?: string): Promise<Summary> => {
    const url = '/api/admin/summary';
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json;
  },

  getOrdersOverTime: async (from: string, to: string, interval: 'day' | 'week' | 'month'): Promise<ChartData[]> => {
    const url = `/api/admin/charts/orders-over-time?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&interval=${encodeURIComponent(interval)}`;
    const { json } = await safeFetch(url);
    return json?.data ?? [];
  },

  getPaymentMethods: async (): Promise<ChartData[]> => {
    const url = '/api/admin/charts/payment-methods';
    const { json } = await safeFetch(url);
    return json?.data ?? [];
  },

  getOrders: async (page: number, limit: number, opts: any = {}, token?: string): Promise<OrdersResp> => {
    const params = new URLSearchParams();
    params.set('page', String(page ?? 1));
    params.set('limit', String(limit ?? 10));
    if (opts?.status) params.set('status', String(opts.status));
    if (opts?.search) params.set('search', String(opts.search));
    const url = `/api/admin/orders?${params.toString()}`;

    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    const items = json?.data ?? json?.items ?? json?.orders ?? [];
    const meta = json?.meta ?? { total: items.length, page, limit };
    return { items, meta, raw: json };
  },

  updateOrderStatus: async (orderId: string, status: string, token?: string): Promise<Order> => {
    const url = `/api/admin/orders/${orderId}/status`;
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    return json?.order ?? json;
  },

  assignDriverToOrder: async (orderId: string, driverId: string | null, token?: string): Promise<Order> => {
    const url = `/api/admin/orders/${orderId}/assign`;
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ driverId }),
    });
    return json?.order ?? json;
  },

  getDrivers: async (token?: string): Promise<Driver[]> => {
    const url = '/api/admin/drivers';
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json?.data ?? json?.items ?? json ?? [];
  },

  createDriver: async (driver: Omit<Driver, 'id'>, token?: string): Promise<Driver> => {
    const url = '/api/admin/drivers';
    const { json } = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(driver),
    });
    return json?.driver ?? json;
  },

  updateDriver: async (driverId: string, driver: Partial<Driver>, token?: string): Promise<Driver> => {
    const url = `/api/admin/drivers/${driverId}`;
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(driver),
    });
    return json?.driver ?? json;
  },

  deleteDriver: async (driverId: string, token?: string): Promise<void> => {
    const url = `/api/admin/drivers/${driverId}`;
    await safeFetch(url, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  },

  /**
   * getDeliveries
   * - Prefer calling /api/admin/deliveries (server-side view or endpoint).
   * - If that fails due to orders.order_id missing (Postgres 42703), automatically fallback
   *   to calling /api/admin/orders and mapping the response into a delivery-like shape.
   * - Normalizes a variety of server shapes so the frontend is resilient.
   */
  getDeliveries: async (token?: string): Promise<any[]> => {
    const url = '/api/admin/deliveries';
    try {
      const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      // The server-side view now provides the normalized shape directly
      return json?.data ?? [];
    } catch (err: any) {
      console.error('getDeliveries failed', err);
      // Rethrow the error, as the server should now provide the correct shape or a clear error
      throw err;
    }
  },

  getCustomers: async (token?: string): Promise<Customer[]> => {
    const url = '/api/admin/customers';
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json?.data ?? json?.customers ?? json ?? [];
  },

  getCustomerById: async (customerId: string, token?: string): Promise<{ customer: Customer; orders: Order[] }> => {
    const url = `/api/admin/customers/${customerId}`;
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json;
  },

  exportReports: async (from?: string, to?: string, status?: string, token?: string): Promise<Blob> => {
    let url = '/api/admin/reports/export';
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    const { res } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return res.blob();
  },

  getSettings: async (token?: string): Promise<any> => {
    const url = '/api/admin/settings';
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json;
  },

  updateSettings: async (settings: any, token?: string): Promise<any> => {
    const url = '/api/admin/settings';
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(settings),
    });
    return json;
  },

  getPublicSettings: async (): Promise<any> => {
    const url = `/api/settings/public`;
    const { json } = await safeFetch(url);
    return json;
  },

  getCoupons: async (token?: string): Promise<any[]> => {
    const url = '/api/admin/coupons';
    const { json } = await safeFetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return json;
  },

  createCoupon: async (coupon: any, token?: string): Promise<any> => {
    const url = '/api/admin/coupons';
    const { json } = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(coupon),
    });
    return json;
  },

  updateCoupon: async (id: string, coupon: any, token?: string): Promise<any> => {
    const url = `/api/admin/coupons/${id}`;
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(coupon),
    });
    return json;
  },

  deleteCoupon: async (id: string, token?: string): Promise<void> => {
    const url = `/api/admin/coupons/${id}`;
    await safeFetch(url, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  },

  updateCouponStatus: async (id: string, isActive: boolean, token?: string): Promise<any> => {
    const url = `/api/admin/coupons/${id}/status`;
    const { json } = await safeFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ is_active: isActive }),
    });
    return json;
  },
};

// convenient exports / aliases used by components elsewhere
export const fetchDrivers = (token?: string) => adminApi.getDrivers(token);
export const fetchOrders = (page: number, limit: number, opts?: any, token?: string) => adminApi.getOrders(page, limit, opts, token);
export const assignDriver = (orderId: string, driverId: string | null, token?: string) => adminApi.assignDriverToOrder(orderId, driverId, token);
export const updateOrderStatus = (orderId: string, status: string, token?: string) => adminApi.updateOrderStatus(orderId, status, token);

export default adminApi;