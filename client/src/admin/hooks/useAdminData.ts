// client/src/admin/hooks/useAdminData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../services/api';
import { Order, Summary, ChartData } from '../types';
import { createClient } from '@supabase/supabase-js';

// Supabase client for frontend realtime (anon key)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface AdminData {
  summary: Summary | null;
  orders: Order[];
  ordersOverTime: ChartData[];
  paymentMethods: ChartData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchPage: (page?: number, limit?: number) => Promise<void>;
}

export const useAdminData = (): AdminData => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersOverTime, setOrdersOverTime] = useState<ChartData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // pagination refs
  const pageRef = useRef<number>(1);
  const limitRef = useRef<number>(10);

  // abort controllers for fetches
  const abortRef = useRef<AbortController | null>(null);

  // supabase subscription ref
  const supaChannelRef = useRef<any | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearAbort = () => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) { /* ignore */ }
      abortRef.current = null;
    }
  };

  const fetchSummary = useCallback(async () => {
    try {
      const data = await adminApi.getSummary();
      if (!mountedRef.current) return;
      setSummary(data);
    } catch (err: any) {
      console.warn('fetchSummary failed', err);
      if (mountedRef.current) setError((err && err.message) || String(err));
    }
  }, []);

  const fetchOrders = useCallback(async (page = pageRef.current, limit = limitRef.current) => {
    // cancel previous
    clearAbort();
    abortRef.current = new AbortController();
    try {
      const data = await adminApi.getOrders(page, limit, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setOrders(data.items || []);
      pageRef.current = page;
      limitRef.current = limit;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('fetchOrders failed', err);
      if (mountedRef.current) setError((err && err.message) || String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const fetchOrdersOverTime = useCallback(async (from?: string, to?: string, interval: 'day' | 'week' | 'month' = 'day') => {
    try {
      const data = await adminApi.getOrdersOverTime(from, to, interval);
      if (!mountedRef.current) return;
      setOrdersOverTime(data || []);
    } catch (err: any) {
      console.warn('fetchOrdersOverTime failed', err);
      if (mountedRef.current) setError((err && err.message) || String(err));
    }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const data = await adminApi.getPaymentMethods();
      if (!mountedRef.current) return;
      setPaymentMethods(data || []);
    } catch (err: any) {
      console.warn('fetchPaymentMethods failed', err);
      if (mountedRef.current) setError((err && err.message) || String(err));
    }
  }, []);

  // Full refetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // fetch in parallel
    await Promise.all([
      fetchSummary(),
      fetchOrders(pageRef.current, limitRef.current),
      fetchOrdersOverTime(),
      fetchPaymentMethods(),
    ]);
    setLoading(false);
  }, [fetchSummary, fetchOrders, fetchOrdersOverTime, fetchPaymentMethods]);

  // Reconcile single order change into current orders array.
  const reconcileOrderChange = useCallback((payload: any) => {
    if (!payload) return;
    const { eventType, new: newRecord, old: oldRecord } = payload;
    // Note: supabase v2 uses payload.eventType and payload.record in some setups;
    // this code attempts common field names for compatibility.
    const record = newRecord ?? payload.record ?? payload.new ?? null;
    const prev = oldRecord ?? payload.old ?? null;
    const evt = eventType ?? payload.eventType ?? payload.type ?? payload.event;

    if (!record && !prev) return;

    setOrders((current) => {
      const copy = [...current];
      // find index by id
      const id = (record && record.id) || (prev && prev.id);
      if (!id) return current;

      const idx = copy.findIndex((o) => o.id === id);

      if (evt === 'INSERT' || evt === 'INSERT'?.toLowerCase?.()) {
        // add if not present
        if (idx === -1 && record) {
          copy.unshift(record as Order);
        }
      } else if (evt === 'UPDATE' || evt === 'UPDATE'?.toLowerCase?.()) {
        if (idx !== -1 && record) {
          // merge update
          copy[idx] = { ...copy[idx], ...record };
        } else if (record) {
          // if not present, add to front
          copy.unshift(record as Order);
        }
      } else if (evt === 'DELETE' || evt === 'DELETE'?.toLowerCase?.()) {
        if (idx !== -1) {
          copy.splice(idx, 1);
        }
      } else {
        // unknown event: fallback to replace by record if available
        if (idx !== -1 && record) {
          copy[idx] = { ...copy[idx], ...record };
        }
      }

      // limit size for memory (keep first 1000)
      if (copy.length > 1000) copy.length = 1000;
      return copy;
    });

    // For changes that affect aggregates (total, status), refetch summary & charts.
    // Conservative heuristic: if record has 'total' or 'status', refresh summary & charts.
    const changedAgg = (record && ('total' in record || 'status' in record)) || (prev && ('total' in prev || 'status' in prev));
    if (changedAgg) {
      // do not await
      fetchSummary();
      fetchOrdersOverTime();
      fetchPaymentMethods();
    }
  }, [fetchSummary, fetchOrdersOverTime, fetchPaymentMethods]);

  // subscribe/unsubscribe logic
  const subscribe = useCallback(() => {
    if (supaChannelRef.current) return; // already subscribed
    try {
      const ch = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          // supabase payload shape varies; pass whole payload to reconciliation
          try {
            reconcileOrderChange(payload);
          } catch (e) {
            console.warn('reconcileOrderChange failed, falling back to full refetch', e);
            fetchData();
          }
        })
        .subscribe();

      supaChannelRef.current = ch;
    } catch (e) {
      console.warn('subscribe failed', e);
    }
  }, [reconcileOrderChange, fetchData]);

  const unsubscribe = useCallback(() => {
    try {
      if (supaChannelRef.current) {
        // remove channel via supabase client
        supabase.removeChannel(supaChannelRef.current);
        supaChannelRef.current = null;
      }
    } catch (e) {
      console.warn('unsubscribe failed', e);
    }
  }, []);

  // Visibility API: pause subscription when hidden to reduce traffic
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        unsubscribe();
      } else {
        // resubscribe and refresh
        subscribe();
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [subscribe, unsubscribe, fetchData]);

  // initial mount: fetch and subscribe
  useEffect(() => {
    fetchData();
    subscribe();

    return () => {
      clearAbort();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPage = useCallback(async (page?: number, limit?: number) => {
    await fetchOrders(page ?? pageRef.current, limit ?? limitRef.current);
  }, [fetchOrders]);

  return {
    summary,
    orders,
    ordersOverTime,
    paymentMethods,
    loading,
    error,
    refetch: fetchData,
    fetchPage,
  };
};
