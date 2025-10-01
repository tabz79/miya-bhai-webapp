// client/src/admin/pages/customers.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import AdminShell from "../components/AdminShell";
import CustomerDrawer from "../components/CustomerDrawer";
// ✅ Fixed import path — points to client/src/lib/supabaseClient.ts
import { supabase } from "../../lib/supabaseClient";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone_normalized: string | null;
  total_spent: number | null;
  last_order_at: string | null;
};

const formatCurrency = (v: number | null | undefined) => {
  if (!v) return "₹0.00";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);
};

const humanDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12; // clean card grid size
  const [totalCount, setTotalCount] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const offset = useMemo(() => (page - 1) * limit, [page]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("customers")
        .select("id, name, email, phone_normalized, total_spent, last_order_at", { count: "exact" })
        .order("last_order_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (query && query.trim().length > 0) {
        const raw = query.trim();
        q = q.or(`name.ilike.%${raw}%,email.ilike.%${raw}%`) as any;
        const digits = raw.replace(/\D/g, "");
        if (digits.length >= 3) {
          q = supabase
            .from("customers")
            .select("id, name, email, phone_normalized, total_spent, last_order_at", { count: "exact" })
            .or(`name.ilike.%${raw}%,email.ilike.%${raw}%,phone_normalized.ilike.%${digits}%`)
            .order("last_order_at", { ascending: false })
            .range(offset, offset + limit - 1) as any;
        }
      }

      const { data, count, error: err } = await q;
      if (err) throw err;
      setCustomers((data as any) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [query, offset]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ---------------------------
  // Realtime subscription: listen for customers table changes and update UI
  // ---------------------------
  const subscriptionRef = useRef<any | null>(null);

  useEffect(() => {
    if (!supabase) return;
    if (subscriptionRef.current) return;

    try {
      const channel = supabase
        .channel("public:customers")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "customers" },
          (payload: any) => {
            // payload may have different shapes depending on client lib version
            const ev = payload.eventType || payload.event || payload.type;
            const newRow = payload.new ?? payload.record ?? null;
            const oldRow = payload.old ?? null;

            if (!newRow && !oldRow) {
              return;
            }

            setCustomers((prev) => {
              // INSERT or UPDATE: newRow present
              if (newRow) {
                const exists = prev.find((c) => String(c.id) === String(newRow.id));
                if (exists) {
                  // merge update into existing list
                  return prev.map((c) => (String(c.id) === String(newRow.id) ? { ...c, ...newRow } : c));
                } else {
                  // insert new at top (keeps recency visible)
                  return [newRow, ...prev].slice(0, limit); // keep UI size manageable
                }
              }

              // DELETE: remove oldRow if present
              if (oldRow) {
                return prev.filter((c) => String(c.id) !== String(oldRow.id));
              }

              return prev;
            });

            // adjust totalCount heuristically
            setTotalCount((t) => {
              if (!ev) return t;
              const upper = String(ev).toUpperCase();
              if (upper === "INSERT" || upper === "INSERT") return t + 1;
              if (upper === "DELETE") return Math.max(0, t - 1);
              return t;
            });
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    } catch (e) {
      console.warn("customers subscription failed", e);
    }

    return () => {
      try {
        if (subscriptionRef.current && supabase) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [limit]);

  const fetchRecentOrders = useCallback(async (customerId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, total, status, created_at, items, payment_status")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  }, []);

  const pages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Customers</h1>
            <p className="text-sm text-slate-500">Directory, lifetime spend & recent activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email or phone"
                className="w-72 rounded-md border p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <div className="absolute right-2 top-2 text-sm text-slate-400">⌘K</div>
            </div>
            <div className="text-sm text-slate-500">{totalCount} customers</div>
          </div>
        </header>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg bg-white" />
                ))
              : customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="p-4 border rounded-lg bg-white hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-medium">{c.name || "(No name)"}</div>
                        <div className="text-sm text-slate-500">{c.email || "—"}</div>
                        <div className="text-sm text-slate-500">{c.phone_normalized || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Last order</div>
                        <div className="font-medium">{humanDate(c.last_order_at)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-slate-500">Lifetime spend</div>
                      <div className="text-lg font-semibold">{formatCurrency(Number(c.total_spent || 0))}</div>
                    </div>
                  </div>
                ))}

            {!loading && customers.length === 0 && (
              <div className="col-span-full p-8 border rounded-lg text-center text-slate-500">
                No customers match your search.
              </div>
            )}
          </div>
        </section>

        <footer className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <div className="text-sm text-slate-600">
              {page} / {pages}
            </div>
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              disabled={page === pages}
            >
              Next
            </button>
          </div>
        </footer>

        {selectedCustomer && (
          <CustomerDrawer
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            fetchRecentOrders={fetchRecentOrders}
          />
        )}
      </div>
    </AdminShell>
  );
}
