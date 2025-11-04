// client/src/services/adminApi.ts
import { supabase } from "@/lib/supabaseClient";

type AnyObj = Record<string, any>;

async function safeFetch(url: string, opts: RequestInit = {}) {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? 'https://miya-bhai-webapp.onrender.com' : '');
  const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  };

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const merged: RequestInit = {
    credentials: 'include',
    headers,
    ...opts,
  };

  if (merged.body && !(merged.body instanceof FormData)) {
    if (!((merged.headers as any)['Content-Type'])) {
      (merged.headers as any)['Content-Type'] = 'application/json';
    }
  }

  const res = await fetch(finalUrl, merged);
  const text = await res.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-json response
  }

  if (!res.ok) {
    const serverMsg = json?.error ?? json?.message ?? text ?? res.statusText;
    const err = new Error(`HTTP ${res.status} — ${serverMsg}`);
    (err as any).raw = json ?? text;
    throw err;
  }

  return json;
}

export const adminApi = {
  async getSummary() {
    return await safeFetch('/api/admin/summary', { method: 'GET' });
  },

  async getOrders({ page = 1, limit = 10, status, search }: { page?: number; limit?: number; status?: string; search?: string; }) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return await safeFetch(`/api/admin/orders?${params.toString()}`, { method: 'GET' });
  },

  async getOrdersOverTime({ from, to, interval }: { from: string; to: string; interval: string; }) {
    const params = new URLSearchParams({ from, to, interval });
    return await safeFetch(`/api/admin/charts/orders-over-time?${params.toString()}`, { method: 'GET' });
  },

  async getPaymentMethods() {
    return await safeFetch('/api/admin/charts/payment-methods', { method: 'GET' });
  },
  
  async updateOrderStatus(orderId: string, status: string, markPaid: boolean) {
    return await safeFetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, markPaid }),
    });
  },
  
  async getDrivers() {
    return await safeFetch('/api/admin/drivers', { method: 'GET' });
  },

  async assignDriver(orderId: string, driverId: string | null) {
    return await safeFetch(`/api/admin/orders/${orderId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ driverId }),
    });
  },
};

export default adminApi;
