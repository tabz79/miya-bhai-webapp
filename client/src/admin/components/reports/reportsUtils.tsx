// client/src/admin/components/reports/reportsUtils.tsx
import { format } from 'date-fns';

export type LineItem = {
  sku?: string;
  name?: string;
  quantity?: number;
  price?: number; // per unit
  total?: number; // sometimes APIs give item total
  [k: string]: any;
};

export type Order = {
  id?: string;
  created_at?: string;
  total_amount?: number;
  amount?: number;
  grand_total?: number;
  line_items?: LineItem[] | any[];
  items?: LineItem[] | any[]; // some APIs use items
  cart_items?: LineItem[] | any[]; // another variant
  payment_method?: string;
  customer_id?: string | null;
  [k: string]: any;
};

export function toDayKey(iso?: string) {
  if (!iso) return 'unknown';
  try {
    const d = new Date(iso);
    return format(d, 'yyyy-MM-dd');
  } catch {
    return String(iso).split('T')[0] || String(iso);
  }
}

/**
 * Build revenue-per-day series from either:
 * - an orders array (preferred) OR
 * - a pre-aggregated series that may contain 'orders' counts (fallback: distribute using avg order value)
 *
 * The returned shape: { period: 'YYYY-MM-DD', revenue: number }
 */
export function buildRevenueSeriesFromOrdersOrSeries(options: {
  orders?: Order[];
  series?: any[]; // possible shapes: { period, orders } or { x, y } or { date, value }
  totalSales?: number;
}) {
  const { orders = [], series = [], totalSales = 0 } = options;

  // If we have orders, aggregate properly from order.total_amount or line_items
  if (orders.length > 0) {
    const map = new Map<string, number>();
    for (const o of orders) {
      const day = toDayKey(o.created_at);
      let amount:
        | number
        | null =
        typeof o.total_amount === 'number'
          ? o.total_amount
          : typeof o.amount === 'number'
          ? o.amount
          : typeof o.grand_total === 'number'
          ? o.grand_total
          : null;

      if (amount === null) {
        const items = Array.isArray(o.line_items) ? o.line_items : Array.isArray(o.items) ? o.items : Array.isArray(o.cart_items) ? o.cart_items : [];
        amount = items.reduce((s: number, it: any) => {
          const q = Number(it.quantity ?? it.qty ?? 0) || 0;
          const p =
            typeof it.price === 'number'
              ? it.price
              : typeof it.total === 'number'
              ? it.total / Math.max(1, q)
              : 0;
          return s + q * p;
        }, 0);
      }

      map.set(day, (map.get(day) || 0) + (amount || 0));
    }

    return Array.from(map.entries())
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => (a.period < b.period ? -1 : 1));
  }

  // Fallback: if we have a series (likely order counts per day), try to create revenue using totalSales
  if (series && series.length > 0) {
    // detect key for count
    const possibleCountKeys = ['orders', 'count', 'value', 'y'];
    const mapped = series.map((s: any) => {
      const period = s.period || s.x || s.date || s.label || (Array.isArray(s) ? s[0] : '') || '';
      let count = 0;
      for (const k of possibleCountKeys) {
        if (typeof s[k] === 'number') {
          count = s[k];
          break;
        }
      }
      return { period, count: Number(count || 0) };
    });

    // If all periods are empty, bail
    const totalCount = mapped.reduce((s: number, r: any) => s + (Number(r.count) || 0), 0);
    const numericTotalSales = Number(totalSales || 0);

    if (totalCount === 0) {
      // Try to map provided series gracefully with zeros
      return mapped.map((r: any) => ({ period: r.period, revenue: 0 }));
    }

    const avgOrder = numericTotalSales / totalCount;

    // compute raw revenues, then round each to 2 decimals and ensure total matches totalSales
    const computed = mapped.map((r: any) => {
      const raw = Number(r.count) * avgOrder;
      const rounded = Math.round(raw * 100) / 100; // two decimals
      return { period: r.period, raw, revenue: rounded };
    });

    const sumRounded = computed.reduce((s: number, c: any) => s + c.revenue, 0);
    const target = Math.round(numericTotalSales * 100) / 100;
    const diff = Math.round((target - sumRounded) * 100) / 100;

    // Distribute the tiny diff to the last day (keeps logic simple and deterministic)
    if (computed.length > 0 && Math.abs(diff) >= 0.01) {
      computed[computed.length - 1].revenue = Math.round((computed[computed.length - 1].revenue + diff) * 100) / 100;
    }

    return computed.map((c: any) => ({ period: c.period, revenue: Number(Math.max(0, c.revenue).toFixed(2)) }));
  }

  return [];
}

/**
 * Helper: robust number parser
 */
function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[^\d.\-]/g, '');
  const n = cleaned === '' ? 0 : Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * normalizeTopItems
 * Accepts either:
 *  - precomputed items: [{ name, units, revenue }, ...]
 *  - raw orders: [{ line_items: [{ name, quantity, price }]} , ...]
 * Returns top N items sorted by revenue desc, each: { name, units, revenue }
 */
export function normalizeTopItems(input: any[] = [], limit = 10) {
  // dev fallback
  if ((!input || input.length === 0) && (globalThis as any).__REPORTS_DEBUG__?.orders) {
    // eslint-disable-next-line no-console
    console.info('[reportsUtils] normalizeTopItems: falling back to __REPORTS_DEBUG__.orders');
    input = (globalThis as any).__REPORTS_DEBUG__.orders || [];
  }

  // If input looks like precomputed top items (has name + units or revenue), pass through
  const looksPrecomputed = Array.isArray(input) && input.length > 0 && input.every(it => {
    return (it && typeof it === 'object') && ('name' in it) && (('units' in it) || ('revenue' in it));
  });

  if (looksPrecomputed) {
    const sanitized = input
      .map((it: any) => ({
        name: String(it.name || '').trim(),
        units: Math.round(toNumber(it.units || it.count || it.qty || 0)),
        revenue: Number((toNumber(it.revenue || it.total || it.sales || 0)).toFixed(2)),
      }))
      .filter(it => it.name)
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .slice(0, limit);
    return sanitized;
  }

  // Otherwise, try to treat input as raw orders
  const itemsMap: Record<string, { name: string; units: number; revenue: number }> = {};

  for (const order of input || []) {
    if (!order || typeof order !== 'object') continue;

    // Prefer line_items, then items, then cart_items
    const sourceItems = Array.isArray(order.line_items)
      ? order.line_items
      : Array.isArray(order.items)
      ? order.items
      : Array.isArray(order.cart_items)
      ? order.cart_items
      : undefined;

    if (!sourceItems || sourceItems.length === 0) continue;

    for (const li of sourceItems) {
      if (!li || typeof li !== 'object') continue;
      const name = String(li.name || li.title || li.label || li.sku || '').trim();
      if (!name) continue;
      const qty = Math.round(toNumber(li.quantity ?? li.qty ?? li.units ?? 0));
      let revenue = toNumber(li.total ?? li.line_total ?? li.revenue ?? 0);
      if (!revenue) {
        const price = toNumber(li.price ?? li.unit_price ?? li.rate ?? li.cost ?? 0);
        revenue = Math.round((qty * price + Number.EPSILON) * 100) / 100;
      }

      if (!itemsMap[name]) itemsMap[name] = { name, units: 0, revenue: 0 };
      itemsMap[name].units += qty;
      itemsMap[name].revenue = Math.round(((itemsMap[name].revenue || 0) + revenue) * 100) / 100;
    }
  }

  const aggregated = Object.values(itemsMap)
    .filter(it => it.name && (it.units > 0 || it.revenue > 0))
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, limit);

  return aggregated;
}

/**
 * Build payment breakdown by amount.
 * Accepts either a pre-aggregated series or computes from orders.
 * Returned shape: [{ name: 'COD', value: 1234 }, ...]
 */
export function buildPaymentBreakdown(options: { orders?: Order[]; breakdown?: any[]; totalSales?: number }) {
  const { orders = [], breakdown = [], totalSales = 0 } = options;

  if (Array.isArray(breakdown) && breakdown.length > 0) {
    // normalize to { name, value }
    return breakdown.map((b: any) => {
      const name = b.name || b.method || b.payment_method || 'Unknown';
      const value = Number(b.value ?? b.amount ?? b.total ?? b.revenue ?? 0);
      return { name, value };
    });
  }

  if (orders.length > 0) {
    const map = new Map<string, number>();
    for (const o of orders) {
      const method = (o.payment_method || 'unknown').toString();
      const amt =
        typeof o.total_amount === 'number'
          ? o.total_amount
          : typeof o.amount === 'number'
          ? o.amount
          : 0;
      map.set(method, (map.get(method) || 0) + (amt || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  // If nothing available, attempt to interpret breakdown if it contains counts: convert counts -> amount using avg
  if (Array.isArray(breakdown) && breakdown.length > 0 && totalSales > 0) {
    const totalCount = breakdown.reduce((s: number, b: any) => s + (Number(b.count || b.orders || 0) || 0), 0);
    const avg = totalCount > 0 ? totalSales / totalCount : 0;
    return breakdown.map((b: any) => ({ name: b.name || 'unknown', value: (Number(b.count || b.orders || 0) || 0) * avg }));
  }

  return [];
}

/**
 * Compute customer growth from orders if needed.
 * Returns { newCustomers, returningCustomers, uniqueCustomers }
 * The function assumes orders contain customer_id and created_at.
 */
export function computeCustomerGrowthFromOrders(orders: Order[] = [], startIso?: string, endIso?: string) {
  const start = startIso ? new Date(startIso).getTime() : -Infinity;
  const end = endIso ? new Date(endIso).getTime() : Infinity;

  // build customer -> { firstTs, totalCount, countInRange }
  const map = new Map<string | null, { firstTs?: number; totalCount: number; countInRange: number }>();
  for (const o of orders) {
    const cid = o.customer_id ?? null;
    const createdTs = o.created_at ? new Date(o.created_at).getTime() : NaN;
    const entry = map.get(cid) || { firstTs: createdTs, totalCount: 0, countInRange: 0 };
    if (Number.isFinite(createdTs) && (!entry.firstTs || createdTs < (entry.firstTs || Infinity))) {
      entry.firstTs = createdTs;
    }
    entry.totalCount += 1;
    if (Number.isFinite(createdTs) && createdTs >= start && createdTs <= end) entry.countInRange += 1;
    map.set(cid, entry);
  }

  let newCustomers = 0;
  let returningCustomers = 0;
  for (const [cid, v] of map.entries()) {
    if (!v.firstTs) continue;
    if (v.firstTs >= start && v.firstTs <= end) newCustomers++;
    if (v.totalCount > 1 || v.countInRange > 1) returningCustomers++;
  }

  return { newCustomers, returningCustomers, uniqueCustomers: map.size };
}
