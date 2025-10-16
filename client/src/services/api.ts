// client/src/services/api.ts
// Public web-site API wrapper.
// Exports both named `api` and default export for compatibility.

type AnyObj = Record<string, any>;

/**
 * Small fetch wrapper that always tries to send/receive JSON and throws clear errors.
 */
async function safeFetch(url: string, opts: RequestInit = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const merged: RequestInit = {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  };

  // If a body is present and not a FormData, assume JSON
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

/**
 * Public-site API surface (minimal, safe set)
 * Add more functions here as the frontend needs them.
 */
export const api = {
  // Get public menu
  async getMenu() {
    return await safeFetch('/api/menu', { method: 'GET' });
  },

  // Create an order (checkout). Payload should be the order object expected by backend.
  async createOrder(orderPayload: AnyObj) {
    return await safeFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  },

  // Get public settings (used by checkout to validate delivery pins etc)
  async getPublicSettings() {
    return await safeFetch('/api/settings/public', { method: 'GET' });
  },

  async validateCoupon(code: string) {
    return await safeFetch(`/api/coupons/validate/${code}`, { method: 'GET' });
  },

  // Get a single order (optional, used by order status pages)
  async getOrder(orderId: string) {
    return await safeFetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
  },

  // Generic helper to POST geo coordinates or other order metadata
  async postJson(path: string, payload: AnyObj) {
    return await safeFetch(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default api;
