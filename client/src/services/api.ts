// client/src/services/api.ts
// Public web-site API wrapper.
// Exports both named `api` and default export for compatibility.

import { supabase } from "@/lib/supabaseClient";

type AnyObj = Record<string, any>;

function isCriticalUrl(u: string) {
  // endpoints where a 401 should be treated as fatal (auth/session issue)
  return (
    u.includes("/api/user") ||
    u.includes("/api/orders") ||
    u.includes("/api/admin") ||
    u.includes("/auth")
  );
}

/**
 * Small fetch wrapper that always tries to send/receive JSON and throws clear errors.
 * Now resilient: 401 on *non-critical* endpoints returns null instead of throwing,
 * so a public fetch failure doesn't wipe auth state.
 */
async function safeFetch(url: string, opts: RequestInit = {}, authenticated = false) {
  const baseUrl = import.meta.env.PROD
    ? "https://miya-bhai-webapp.onrender.com"
    : (import.meta.env.VITE_API_BASE_URL as string) || "";
  const finalUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  if (authenticated) {
    console.log('[safeFetch] Attempting to get Supabase session for authenticated request.');
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('[safeFetch] Error getting session:', error);
    }

    if (session) {
      console.log('[safeFetch] Session found.');
      if (session.access_token) {
        console.log('[safeFetch] Access token found, adding to headers.');
        headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('[safeFetch] Session found, but it has no access token.');
      }
    } else {
      console.warn('[safeFetch] No session found for authenticated request.');
    }
  }

  const merged: RequestInit = {
    credentials: "include",
    headers,
    ...opts,
  };

  // If a body is present and not a FormData, assume JSON
  if (merged.body && !(merged.body instanceof FormData)) {
    if (!((merged.headers as any)["Content-Type"])) {
      (merged.headers as any)["Content-Type"] = "application/json";
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
    // 🚧 Harden 401 handling
    if (res.status === 401) {
      const critical = authenticated || isCriticalUrl(finalUrl);
      if (critical) {
        const serverMsg = json?.error ?? json?.message ?? text ?? res.statusText;
        const err = new Error(`HTTP 401 — ${serverMsg || "Auth required"}`);
        (err as any).raw = json ?? text;
        throw err;
      } else {
        // Non-critical: don't break session; caller can coalesce
        console.warn("[safeFetch] 401 on non-critical endpoint:", finalUrl);
        return null;
      }
    }

    // Other errors still throw
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
    return await safeFetch("/api/menu", { method: "GET" });
  },

  async getCoupons() {
    // Non-critical: coalesce to []
    return (await safeFetch("/api/coupons", { method: "GET" })) || [];
  },

  // Create an order (checkout). Payload should be the order object expected by backend.
  async createOrder(orderPayload: AnyObj) {
    // Check if user is logged in to send authenticated request
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isAuthenticated = !!session;

    return await safeFetch(
      "/api/orders",
      {
        method: "POST",
        body: JSON.stringify(orderPayload),
      },
      isAuthenticated
    );
  },

  // Get public settings (used by checkout to validate delivery pins etc)
  async getPublicSettings() {
    return await safeFetch("/api/settings/public", { method: "GET" });
  },

  async validateCoupon(code: string) {
    // Non-critical; caller can handle null (invalid/expired)
    return await safeFetch(`/api/coupons/validate/${code}`, { method: "GET" });
  },

  // Get a single order (optional, used by order status pages)
  async getOrder(orderId: string) {
    return await safeFetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  },

  // Generic helper to POST geo coordinates or other order metadata
  async postJson(path: string, payload: AnyObj) {
    return await safeFetch(path, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Get user profile (authenticated)
  async getUserProfile() {
    return await safeFetch("/api/user/profile", { method: "GET" }, true);
  },

  // Get user orders (authenticated)
  async getUserOrders() {
    return await safeFetch("/api/user/orders", { method: "GET" }, true);
  },

  // Get user addresses (authenticated)
  async getUserAddresses() {
    return await safeFetch("/api/user/addresses", { method: "GET" }, true);
  },

  // Update user profile (authenticated)
  async updateUserProfile(profileData: AnyObj) {
    return await safeFetch(
      "/api/user/profile",
      {
        method: "PUT",
        body: JSON.stringify(profileData),
      },
      true
    );
  },

  // Update user address (authenticated)
  async updateUserProfileAddress(addressData: AnyObj) {
    return await safeFetch(
      "/api/user/profile/address",
      {
        method: "PUT",
        body: JSON.stringify(addressData),
      },
      true
    );
  },

  // Admin: Get all orders (paginated)
  async getAdminOrders({
    page = 1,
    limit = 25,
    status,
    search,
  }: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    return await safeFetch(`/api/orders?${params.toString()}`, { method: "GET" }, true);
  },

  // Admin: Assign driver to order
  async assignDriverToOrder(orderId: string, staffId: string) {
    return await safeFetch(
      `/api/orders/${orderId}/assign`,
      {
        method: "PUT",
        body: JSON.stringify({ staffId }),
      },
      true
    );
  },
};

export default api;
