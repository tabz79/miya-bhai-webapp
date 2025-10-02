// client/src/admin/components/reports/TopSellingItems.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { normalizeTopItems } from './reportsUtils';

interface TopSellingItemsProps {
  topSellingItems?: any[]; // optionally backend-provided aggregated items
  orders?: any[]; // optionally raw orders (each with items/line_items)
  loading?: boolean;
  limit?: number;
}

const brandColors = {
  primary: '#ae905c',
  secondary: '#746d52',
  accent: '#675b46',
};

const eqArrayJSON = (a: any[] | null, b: any[] | null) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

/** Given an orders[] where each order has items[] (or line_items[]), aggregate into [{name, units, revenue}] */
function aggregateFromOrders(orders: any[] = []) {
  const map: Record<string, { name: string; units: number; revenue: number }> = {};

  for (const o of orders) {
    const lineItems = Array.isArray(o.items) ? o.items
      : Array.isArray(o.line_items) ? o.line_items
      : Array.isArray(o.cart_items) ? o.cart_items
      : [];

    for (const li of lineItems) {
      if (!li) continue;

      // name detection (prefer explicit, then meta name, then productId/sku)
      const name =
        (li.name && String(li.name).trim()) ||
        (li.meta && (li.meta.name || li.meta.title)) ||
        li.productId ||
        li.product_id ||
        li.sku ||
        'Unknown';

      // units detection
      const units = Number(li.qty ?? li.quantity ?? li.units ?? li.count ?? 0) || 0;

      // price detection (per unit)
      const perUnit =
        Number(li.unitPrice ?? li.unit_price ?? li.price ?? li.meta?.price ?? li.rate ?? 0) || 0;

      // revenue detection (li.total or units * perUnit)
      const revenue =
        Number(li.total ?? li.total_amount ?? li.itemTotal ?? (units * perUnit) ?? 0) || 0;

      if (!map[name]) map[name] = { name, units: 0, revenue: 0 };
      map[name].units += units;
      map[name].revenue = Math.round((map[name].revenue + revenue) * 100) / 100;
    }
  }

  return Object.values(map)
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .map(it => ({ name: it.name, units: it.units, revenue: Number(it.revenue.toFixed(2)) }));
}

/** Recursively search payload for first array that looks like orders */
function findOrderLikeArray(obj: any): any[] | null {
  const seen = new Set<any>();
  function isOrderLikeArray(arr: any[]): boolean {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    for (const el of arr) {
      if (!el || typeof el !== 'object') continue;
      if (Array.isArray(el.line_items) || Array.isArray(el.items) || Array.isArray(el.cart_items)) return true;
      if ('id' in el && ('created_at' in el || 'date' in el || 'created' in el)) return true;
    }
    return false;
  }

  function walk(node: any): any[] | null {
    if (node === null || typeof node !== 'object') return null;
    if (seen.has(node)) return null;
    seen.add(node);
    if (Array.isArray(node)) {
      if (isOrderLikeArray(node)) return node;
      for (const el of node) {
        const found = walk(el);
        if (found) return found;
      }
      return null;
    }
    for (const k of Object.keys(node)) {
      const val = node[k];
      if (Array.isArray(val) && isOrderLikeArray(val)) return val;
    }
    for (const k of Object.keys(node)) {
      const found = walk(node[k]);
      if (found) return found;
    }
    return null;
  }

  return walk(obj);
}

const TopSellingItems: React.FC<TopSellingItemsProps> = ({
  topSellingItems = [],
  orders = [],
  loading = false,
  limit = 10,
}) => {
  const [normalized, setNormalized] = useState<any[] | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('none');

  // central compute that accepts either:
  // - aggregated topSellingItems shape (name, units, revenue)
  // - orders array (with items[]) — we aggregate line items then normalize
  const computeNormalized = useCallback((input: any[], label: string) => {
    try {
      // detect orders-like: elements contain items/line_items arrays
      const isOrdersArray = Array.isArray(input) && input.some(el => el && typeof el === 'object' && (Array.isArray(el.items) || Array.isArray(el.line_items) || Array.isArray(el.cart_items)));

      let toNormalize: any[] = [];
      if (isOrdersArray) {
        // aggregate into top-items shape
        toNormalize = aggregateFromOrders(input);
        setSourceLabel(prev => (prev === label ? prev : label + ' (aggregated)'));
      } else {
        // assume either precomputed topSellingItems or already item-list shape
        toNormalize = input || [];
        setSourceLabel(prev => (prev === label ? prev : label));
      }

      // use existing util to further clean/sort/limit if needed
      const out = normalizeTopItems(toNormalize, limit) || [];
      setNormalized(prev => (eqArrayJSON(prev, out) ? prev : out));
      return out;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[TopSellingItems] computeNormalized failed', err);
      setSourceLabel(label);
      setNormalized(prev => (eqArrayJSON(prev, []) ? prev : []));
      return [];
    }
  }, [limit]);

  // main effect: choose source
  useEffect(() => {
    if (Array.isArray(topSellingItems) && topSellingItems.length > 0) {
      computeNormalized(topSellingItems, 'topSellingItems prop');
      return;
    }
    if (Array.isArray(orders) && orders.length > 0) {
      computeNormalized(orders, 'orders prop');
      return;
    }

    // aggressive: scan entire debug payload for order-like arrays
    const dbg = (window as any).__REPORTS_DEBUG__;
    if (dbg && typeof dbg === 'object') {
      const commonPaths = [
        dbg.orders,
        dbg.topSellingItems,
        dbg.data?.orders,
        dbg.report?.orders,
        dbg.payload?.orders,
        dbg.results?.orders,
        dbg.data,
        dbg.results,
        dbg.payload,
        dbg.report,
      ];
      for (const candidate of commonPaths) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          if (candidate.some((el: any) => el && typeof el === 'object' && (Array.isArray(el.line_items) || Array.isArray(el.items) || Array.isArray(el.cart_items) || ('id' in el && ('created_at' in el || 'date' in el))))) {
            computeNormalized(candidate, 'window.__REPORTS_DEBUG__ (common path)');
            return;
          }
        }
      }
      const found = findOrderLikeArray(dbg);
      if (found && found.length > 0) {
        // eslint-disable-next-line no-console
        console.info('[Reports] TopSellingItems: found order-like array via deep scan in __REPORTS_DEBUG__');
        computeNormalized(found, 'window.__REPORTS_DEBUG__ (deep scan)');
        return;
      }
    }

    // nothing found
    setSourceLabel('none');
    setNormalized(prev => (eqArrayJSON(prev, []) ? prev : []));
  }, [topSellingItems, orders, computeNormalized]);

  // polling to pick up console-injected mocks quickly (small window)
  useEffect(() => {
    const dbg = (window as any).__REPORTS_DEBUG__;
    if (!dbg) return;
    const initialOrders = Array.isArray(dbg.orders) ? dbg.orders.length : 0;
    if (initialOrders > 0) return;

    let mounted = true;
    let lastLen = initialOrders;
    const interval = setInterval(() => {
      if (!mounted) return;
      const nowLen = (window as any).__REPORTS_DEBUG__?.orders?.length || 0;
      if (nowLen !== lastLen && nowLen > 0) {
        // eslint-disable-next-line no-console
        console.info('[Reports] TopSellingItems detected debug.orders change, recomputing...');
        computeNormalized((window as any).__REPORTS_DEBUG__.orders, 'window.__REPORTS_DEBUG__.orders (dev fallback)');
        clearInterval(interval);
      }
      lastLen = nowLen;
    }, 300);

    const timeout = setTimeout(() => clearInterval(interval), 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [computeNormalized]);

  if (loading) return <div>Loading...</div>;

  const rendered = Array.isArray(normalized) ? normalized : [];

  if (!rendered || rendered.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
            <p className="text-sm text-gray-500 mb-2">
              Top selling items not available — make sure the API returns either:
            </p>
            <ul className="text-sm text-gray-500 list-disc ml-5 mb-3">
              <li><strong>precomputed</strong> top items (array of <code>{'{ name, units, revenue }'}</code>), OR</li>
              <li><strong>raw orders</strong> where each order includes <code>items</code> / <code>line_items</code> with <code>qty/name/price</code>.</li>
            </ul>
            <p className="text-xs text-gray-400">
              Dev tip: sample backend shape expected for an order — <code>{'{ id, created_at, items: [{ qty, name, unitPrice }] }'}</code>
            </p>
          </div>

          <div className="ml-4">
            <button
              onClick={() => {
                const dbgOrders = (window as any).__REPORTS_DEBUG__?.orders || [];
                if (Array.isArray(topSellingItems) && topSellingItems.length > 0) {
                  computeNormalized(topSellingItems, 'topSellingItems prop (manual)');
                } else if (Array.isArray(orders) && orders.length > 0) {
                  computeNormalized(orders, 'orders prop (manual)');
                } else if (dbgOrders && dbgOrders.length > 0) {
                  computeNormalized(dbgOrders, 'window.__REPORTS_DEBUG__.orders (manual)');
                } else {
                  const found = findOrderLikeArray((window as any).__REPORTS_DEBUG__ || {});
                  if (found && found.length > 0) {
                    // eslint-disable-next-line no-console
                    console.info('[TopSellingItems] manual deep-scan found orders, using them');
                    computeNormalized(found, 'window.__REPORTS_DEBUG__ (manual deep scan)');
                  } else {
                    // eslint-disable-next-line no-console
                    console.info('[TopSellingItems] No data to refresh');
                    setNormalized(prev => (eqArrayJSON(prev, []) ? prev : []));
                  }
                }
              }}
              className="text-sm px-3 py-2 rounded bg-gray-100 border"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Top Selling Items</h3>
        <div className="text-xs text-gray-400">Source: {sourceLabel}</div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rendered} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'revenue') {
                return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
              }
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="units" fill={brandColors.primary} name="Units Sold" />
          <Bar dataKey="revenue" fill={brandColors.secondary} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopSellingItems;
