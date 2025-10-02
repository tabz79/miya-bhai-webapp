import { useState, useEffect, useCallback, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { adminApi } from '@/admin/services/api';
import { Order, ChartData } from '@/admin/types';

// A new hook specifically for the reports page to avoid touching the existing useAdminData hook.
export const useReportsData = (dateRange: DateRange | undefined) => {
  const [salesSummary, setSalesSummary] = useState({ totalSales: 0, netSales: 0, totalTax: 0 });
  const [ordersCount, setOrdersCount] = useState(0);
  const [salesByDate, setSalesByDate] = useState<ChartData[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<ChartData[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState({ new: 0, returning: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keeps track of last attached orders count to avoid infinite re-processing
  const lastAttachedCountRef = useRef<number>(0);

  // -------------------------
  // Helper: read orders from global debug object (if present)
  // -------------------------
  const readDebugOrdersFromWindow = useCallback((): Order[] => {
    try {
      // Accept multiple shapes: __REPORTS_DEBUG__.orders or __raw__.data / __raw__.orders etc.
      const dbg = (window as any).__REPORTS_DEBUG__ ?? {};
      const raw = dbg.__raw__ ?? dbg;
      const maybe = dbg.orders ?? raw.data ?? raw.orders ?? raw.results ?? raw.payload ?? [];
      return Array.isArray(maybe) ? maybe : [];
    } catch {
      return [];
    }
  }, []);

  // -------------------------
  // Core: processOrders (unchanged logic, but robust to different item shapes)
  // -------------------------
  const processOrders = useCallback((orders: Order[]) => {
    // 1. Sales Summary
    const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    setSalesSummary({ totalSales, netSales: totalSales, totalTax: 0 });

    // 2. Orders Count
    setOrdersCount(orders.length);

    // 3. Top Selling Items
    const itemCounts: { [key: string]: { name: string, units: number, revenue: number } } = {};
    orders.forEach((order: any) => {
      const lines = order.line_items || order.items || order.cart_items || [];
      lines.forEach((item: any) => {
        const pid = item.product_id ?? item.productId ?? item.sku ?? item.id ?? item.name ?? 'unknown';
        const qty = Number(item.quantity ?? item.qty ?? 0) || 0;
        const price = Number(item.price ?? item.unit_price ?? item.unitPrice ?? item.meta?.price ?? 0) || 0;
        if (itemCounts[pid]) {
          itemCounts[pid].units += qty;
          itemCounts[pid].revenue += price * qty;
        } else {
          itemCounts[pid] = { name: item.name ?? item.meta?.name ?? String(pid), units: qty, revenue: price * qty };
        }
      });
    });
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 10)
      .map(it => ({ ...it, revenue: Math.round(it.revenue * 100) / 100 }));
    setTopSellingItems(topItems);

    // 4. Customer Growth
    const seen = new Set<string>();
    let newCustomers = 0;
    let returningCustomers = 0;
    orders.forEach((order: any) => {
      const cid = order.customer_id ?? order.customerId ?? order.customer_email ?? order.customer_phone ?? null;
      if (!cid) return;
      if (seen.has(cid)) returningCustomers++;
      else { newCustomers++; seen.add(cid); }
    });
    setCustomerGrowth({ new: newCustomers, returning: returningCustomers });
  }, []);

  // -------------------------
  // Try to attach orders already present on the window object
  // -------------------------
  const tryAttachFromWindow = useCallback(() => {
    const debugOrders = readDebugOrdersFromWindow();
    const count = debugOrders.length;

    // No-op if count hasn't changed to prevent repeated processing
    if (count === lastAttachedCountRef.current) return false;

    lastAttachedCountRef.current = count;
    if (count > 0) {
      console.info('[useReportsData] attaching orders from window.__REPORTS_DEBUG__ (count=', count, ')');
      processOrders(debugOrders);
      return true;
    }

    // If count dropped to zero, clear derived state
    if (count === 0) {
      processOrders([]);
    }
    return false;
  }, [processOrders, readDebugOrdersFromWindow]);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      // still try to pick up any attached debug orders right away
      tryAttachFromWindow();
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const from = dateRange.from!.toISOString();
        const to = dateRange.to!.toISOString();

        // Fetch data in parallel
        const [ordersOverTimeRes, paymentMethodsRes, allOrdersRes] = await Promise.all([
          adminApi.getOrdersOverTime(from, to, 'day'),
          adminApi.getPaymentMethods(), // This probably isn't filtered by date on the backend, but we fetch it anyway
          fetchAllOrders(dateRange), // Helper to fetch all pages of orders
        ]);

        if (cancelled) return;

        // Process server responses we care about
        setSalesByDate(ordersOverTimeRes);
        setPaymentBreakdown(paymentMethodsRes);

        // If server returned orders, use them. If not, attempt global fallback.
        if (Array.isArray(allOrdersRes) && allOrdersRes.length > 0) {
          processOrders(allOrdersRes);
          lastAttachedCountRef.current = allOrdersRes.length;
        } else {
          // fallback to window debug object if present
          const attached = tryAttachFromWindow();
          if (!attached) {
            // clear existing derived state so UI shows 'not available' clearly
            processOrders([]);
            lastAttachedCountRef.current = 0;
          }
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [dateRange, /* fetchAllOrders intentionally omitted from deps */ processOrders, tryAttachFromWindow]);

  // -------------------------
  // fetchAllOrders as before (unchanged except small typing)
  // -------------------------
  async function fetchAllOrders(dateRange: DateRange): Promise<Order[]> {
    let allOrders: Order[] = [];
    let page = 1;
    const limit = 100;
    while (true) {
      const { items, meta } = await adminApi.getOrders(page, limit, {});
      allOrders = allOrders.concat(items);
      if (allOrders.length >= meta.total || items.length < limit) break;
      page++;
    }
    // Filter by the provided date range client-side
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }

  // -------------------------
  // Listen for manual/global updates (auto-refetch console snippet dispatches this event)
  // -------------------------
  useEffect(() => {
    // Attempt attach immediately on mount as well (covers when hook is used without dateRange yet)
    tryAttachFromWindow();

    // simple throttled handler: ignore repeated calls within 250ms
    let last = 0;
    const handler = () => {
      const now = Date.now();
      if (now - last < 250) return;
      last = now;
      const ok = tryAttachFromWindow();
      if (!ok) {
        console.info('[useReportsData] reports-debug-updated received but no new orders present on window');
      }
    };

    window.addEventListener('reports-debug-updated', handler);
    return () => window.removeEventListener('reports-debug-updated', handler);
  }, [tryAttachFromWindow]);

  return { salesSummary, ordersCount, salesByDate, topSellingItems, paymentBreakdown, customerGrowth, loading, error };
};
