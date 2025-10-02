// client/src/admin/pages/reports.tsx
import React, { useEffect } from 'react';
import AdminShell from '@/admin/components/AdminShell';
import DateRangePicker from '@/admin/components/reports/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { useReportsData } from '@/admin/hooks/useReportsData';
import SalesSummary from '@/admin/components/reports/SalesSummary';
import OrdersCount from '@/admin/components/reports/OrdersCount';
import TopSellingItems from '@/admin/components/reports/TopSellingItems';
import PaymentBreakdown from '@/admin/components/reports/PaymentBreakdown';
import CustomerGrowth from '@/admin/components/reports/CustomerGrowth';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/admin/services/api';

const normalizePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') return {
    orders: [],
    salesByDate: [],
    salesSummary: {},
    topSellingItems: [],
    paymentBreakdown: [],
    customerGrowth: null,
    __raw__: payload,
  };

  const orders = payload.orders ?? payload.data ?? payload.results ?? payload.payload ?? [];
  const topSellingItems = payload.topSellingItems ?? payload.top_selling_items ?? payload.top_items ?? [];
  const salesSummary = payload.salesSummary ?? payload.sales_summary ?? payload.meta ?? payload.summary ?? {};
  const salesByDate = payload.salesByDate ?? payload.series ?? payload.by_date ?? [];
  const paymentBreakdown = payload.paymentBreakdown ?? payload.payments ?? payload.breakdown ?? [];
  const customerGrowth = payload.customerGrowth ?? payload.customer_growth ?? payload.customers ?? null;

  return {
    ...payload,
    orders,
    topSellingItems,
    salesSummary,
    salesByDate,
    paymentBreakdown,
    customerGrowth,
    __raw__: payload,
  };
};

const ReportsPage = () => {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const { 
    salesSummary,
    ordersCount,
    salesByDate,
    topSellingItems,
    paymentBreakdown,
    customerGrowth,
    loading,
    error,
    orders = [], // attempt to pick raw orders if hook provides them; default to []
  } = useReportsData(dateRange);

  // ISO strings for range to pass down
  const rangeStartIso = dateRange?.from ? dateRange.from.toISOString() : undefined;
  const rangeEndIso = dateRange?.to ? dateRange.to.toISOString() : undefined;

  // Small dev-only debug hook: attaches current reports data to window for quick inspection.
  // The code below normalizes the shape and — if orders are empty — tries a one-time dev fetch
  // using adminApi.getReports (if available). Additionally it will fallback to __raw__.data if present.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // first prefer the values the hook gave us
      let debugObj: any = {
        orders: orders ?? [],
        salesByDate: salesByDate ?? [],
        salesSummary: salesSummary ?? {},
        topSellingItems: topSellingItems ?? [],
        paymentBreakdown: paymentBreakdown ?? [],
        customerGrowth: customerGrowth ?? null,
        rangeStartIso,
        rangeEndIso,
      };

      // If orders are empty, attempt a dev fetch from the same reports endpoint to get the raw envelope.
      try {
        const shouldAttemptDevFetch = (Array.isArray(debugObj.orders) && debugObj.orders.length === 0);
        if (shouldAttemptDevFetch && adminApi && typeof (adminApi as any).getReports === 'function') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const raw = await (adminApi as any).getReports(rangeStartIso, rangeEndIso);
          if (!cancelled && raw) {
            debugObj = raw;
            // eslint-disable-next-line no-console
            console.info('[Reports] debug: fetched raw payload via adminApi.getReports');
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Reports] dev fetch getReports failed (continuing with hook values)', err);
      }

      // Always normalize the debug object to a predictable shape before attaching.
      let finalDebug: any = normalizePayload(debugObj);

      // ********** IMPORTANT FALLBACK: if orders still empty, try to extract from finalDebug.__raw__ **********
      // (your API previously returned { data: [ ...orders ], meta: {...} } — this fills that gap)
      if ((!Array.isArray(finalDebug.orders) || finalDebug.orders.length === 0)) {
        const raw = finalDebug.__raw__ ?? {};
        const fallbackCandidates = [
          raw.data,
          raw.orders,
          raw.results,
          raw.payload,
          // sometimes server nests under data.data or similar; handle shallow variants:
          raw.data?.data,
          raw.payload?.data,
        ];
        for (const cand of fallbackCandidates) {
          if (Array.isArray(cand) && cand.length > 0) {
            finalDebug.orders = cand;
            // eslint-disable-next-line no-console
            console.info('[Reports] normalized debug: populated orders from finalDebug.__raw__ fallback (data/results/orders)');
            break;
          }
        }
      }

      // Attach normalized debug object
      if (!cancelled && typeof window !== 'undefined') {
        (window as any).__REPORTS_DEBUG__ = finalDebug;
        // eslint-disable-next-line no-console
        console.log('Reports debug object attached: window.__REPORTS_DEBUG__');
        // eslint-disable-next-line no-console
        console.log('[Reports] normalized debug summary:', {
          ordersCount: Array.isArray(finalDebug.orders) ? finalDebug.orders.length : 0,
          salesByDate: finalDebug.salesByDate?.length ?? 0,
          topSellingItems: finalDebug.topSellingItems?.length ?? 0,
        });
      }
    })();

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && (window as any).__REPORTS_DEBUG__) {
        try { delete (window as any).__REPORTS_DEBUG__; } catch {}
      }
    };
  }, [
    orders,
    salesByDate,
    salesSummary,
    topSellingItems,
    paymentBreakdown,
    customerGrowth,
    rangeStartIso,
    rangeEndIso,
  ]);

  const handleExport = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    try {
      const blob = await adminApi.exportReports(dateRange.from.toISOString(), dateRange.to.toISOString());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export report', err);
    }
  };

  return (
    <AdminShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker onDateChange={setDateRange} />
          <Button onClick={handleExport} disabled={loading}>Export CSV</Button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4">
          {/* Pass orders so SalesSummary can aggregate exact revenue if available */}
          <SalesSummary
            salesSummary={salesSummary}
            salesByDate={salesByDate}
            orders={orders}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-2">
          {/* TopSellingItems accepts aggregated topSellingItems; pass raw orders so it can aggregate if needed */}
          <TopSellingItems topSellingItems={topSellingItems} orders={orders} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          {/* Pass orders and totalSales so PaymentBreakdown can compute amounts if needed */}
          <PaymentBreakdown
            paymentBreakdown={paymentBreakdown}
            loading={loading}
            orders={orders}
            totalSales={salesSummary?.totalSales ?? salesSummary?.total_sales ?? 0}
          />
        </div>

        <div className="lg:col-span-2">
          <OrdersCount ordersCount={ordersCount} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          {/* Allow CustomerGrowth to compute itself from orders if API value not provided */}
          <CustomerGrowth
            customerGrowth={customerGrowth}
            loading={loading}
            orders={orders}
            rangeStart={rangeStartIso}
            rangeEnd={rangeEndIso}
          />
        </div>
      </div>
    </AdminShell>
  );
};

export default ReportsPage;
