// client/src/admin/pages/delivery.tsx
import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../components/AdminShell';
import { adminApi } from '../services/api';

type DeliveryRaw = {
  // be tolerant — server uses lots of different shapes
  orderId?: string;
  order_id?: string;
  id?: string;
  assigned_to?: string;
  driverId?: string;
  driver_id?: string;
  driver_name?: string;
  driverName?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  payment?: any;
  payment_method?: string;
  payment_status?: string;
  meta?: any;
  [k: string]: any;
};

type Delivery = {
  orderId: string;
  driverId?: string | null;
  driverName?: string | null;
  status?: string;
  paymentMode?: string;
  paymentStatus?: string;
  collectAmount?: number | null; // amount rider should collect (for COD)
  raw?: DeliveryRaw;
};

const normalizeOrderId = (r: DeliveryRaw) => r.orderId ?? r.order_id ?? r.id ?? '';

/** Try to infer payment mode/status/amount from common locations in the raw payload */
function inferPayment(raw: DeliveryRaw) {
  // possible locations/fields:
  // raw.payment = { method: 'COD'|'ONLINE', status: 'PAID'|'PENDING', amount: 230 }
  // raw.payment_method, raw.payment_status
  // raw.meta?.payment_method, raw.meta?.payment_status, raw.meta?.total
  // raw.total or raw.amount
  const out: { paymentMode?: string; paymentStatus?: string; collectAmount?: number | null } = {
    paymentMode: undefined,
    paymentStatus: undefined,
    collectAmount: null,
  };

  const p = raw.payment ?? raw.meta?.payment ?? null;

  const pick = (keys: string[]) => {
    for (const k of keys) {
      const v = (raw as any)[k] ?? raw.meta?.[k] ?? p?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  // raw flags
  const method = (pick(['payment_method', 'paymentMethod', 'method']) || '').toString();
  const status = (pick(['payment_status', 'paymentStatus', 'status']) || '').toString();

  // numeric amount candidates
  const numeric = (v: any) => {
    if (v == null) return null;
    const n = Number((typeof v === 'string' ? v.replace(/[^\d.-]/g, '') : v));
    return Number.isFinite(n) ? n : null;
  };

  const amt = numeric(pick(['collect_amount', 'collectAmount', 'amount', 'total', 'meta_total', 'meta?.total', 'meta.total']));

  // Heuristics:
  if (method) {
    out.paymentMode = method.toUpperCase();
  } else if (p?.method) {
    out.paymentMode = String(p.method).toUpperCase();
  } else if (/cod|cash/i.test(String(pick(['payment_method', 'paymentMethod', 'method']) ?? ''))) {
    out.paymentMode = 'COD';
  } else if (/online|card|upi|wallet/i.test(String(pick(['payment_method', 'paymentMethod', 'method']) ?? ''))) {
    out.paymentMode = 'ONLINE';
  }

  // Payment status inference
  if (status) {
    out.paymentStatus = status.toUpperCase();
  } else if (p?.status) {
    out.paymentStatus = String(p.status).toUpperCase();
  } else {
    // If method is online and there's evidence of txn id / paid flag, mark paid
    if (out.paymentMode === 'ONLINE') out.paymentStatus = 'PAID';
    else out.paymentStatus = 'PENDING';
  }

  // For COD, the rider collects amount -> prefer explicit amount, fallback to total
  if (out.paymentMode === 'COD') {
    out.collectAmount = numeric(amt ?? raw.total ?? raw.amount ?? raw.meta?.total) ?? null;
    // if no amount found, leave null (UI will show '—' and rider can inspect order)
  } else {
    // Not COD: if paid or has total, don't set collectAmount; but if online and status indicates PAID, set collectAmount to 0
    if (out.paymentMode === 'ONLINE' || out.paymentStatus === 'PAID') {
      out.collectAmount = 0;
    } else {
      out.collectAmount = null;
    }
  }

  return out;
}

const AdminDeliveryPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminApi.getDeliveries?.();
      const list: DeliveryRaw[] = Array.isArray(resp) ? resp : (resp?.data ?? resp ?? []);
      // normalize into minimal shape required by UI
      const normalized: Delivery[] = (list || []).map((r) => {
        const orderId = normalizeOrderId(r) || 'unknown';
        const driverName = r.driverName ?? r.driver_name ?? null;
        const driverId = r.driverId ?? r.driver_id ?? r.assigned_to ?? null;
        const status = r.status ?? null;

        const payment = inferPayment(r);

        const paymentMode = payment.paymentMode ?? (r.payment_method ?? r.meta?.payment_method ?? undefined);
        const paymentStatus = payment.paymentStatus ?? (r.payment_status ?? r.meta?.payment_status ?? undefined);
        const collectAmount = payment.collectAmount;

        return {
          orderId,
          driverId,
          driverName,
          status,
          paymentMode,
          paymentStatus,
          collectAmount,
          raw: r,
        };
      });

      setDeliveries(normalized);
    } catch (err: any) {
      console.error('loadDeliveries failed', err);
      setError(err?.message ?? 'Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
    const handler = () => {
      loadDeliveries();
    };
    window.addEventListener('miya:refresh-deliveries', handler as EventListener);
    // also refresh when orders change
    window.addEventListener('miya:refresh-orders', handler as EventListener);
    return () => {
      window.removeEventListener('miya:refresh-deliveries', handler as EventListener);
      window.removeEventListener('miya:refresh-orders', handler as EventListener);
    };
  }, [loadDeliveries]);

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Delivery Assignments</h2>

        {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.length === 0 && !loading && !error && (
            <div className="text-sm text-gray-500">No deliveries found.</div>
          )}

          {deliveries.map((d) => (
            <div key={d.orderId} className="border p-4 rounded-lg">
              <p><strong>Order:</strong> {d.orderId}</p>
              <p><strong>Driver:</strong> {d.driverName ?? d.driverId ?? '—'}</p>
              <p><strong>Status:</strong> {d.status ?? '—'}</p>

              <div className="mt-2">
                <p className="text-sm"><strong>Payment mode:</strong> {d.paymentMode ?? '—'}</p>

                <p className="text-sm">
                  <strong>Payment status:</strong>{' '}
                  {d.paymentMode === 'COD'
                    ? (d.collectAmount != null ? `Collect ₹${Number(d.collectAmount).toFixed(2)}` : 'Collect —')
                    : (d.paymentStatus ? (d.paymentStatus === 'PAID' ? 'Paid' : d.paymentStatus) : '—')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDeliveryPage;
