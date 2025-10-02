// client/src/admin/components/reports/SalesSummary.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import LineChartCard from '@/admin/components/LineChartCard';
import { buildRevenueSeriesFromOrdersOrSeries } from './reportsUtils';

interface SalesSummaryProps {
  salesSummary?: any;
  salesByDate?: any[];
  loading?: boolean;
  orders?: any[];
}

const SalesSummary: React.FC<SalesSummaryProps> = ({
  salesSummary = {},
  salesByDate = [],
  orders = [],
  loading = false,
}) => {
  const moneyFmt = (value: any) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
  const brandColors = { primary: '#ae905c' };

  const { chartData, chartSeries, usedSource, usedStrategy } = useMemo(() => {
    const dbg = (window as any).__REPORTS_DEBUG__ || {};
    const srcSalesByDate = (salesByDate && salesByDate.length) ? salesByDate : (dbg.salesByDate || []);
    const srcOrders = (orders && orders.length) ? orders : (dbg.orders || []);
    const srcSalesSummary = (Object.keys(salesSummary || {}).length ? salesSummary : (dbg.salesSummary || {}));

    const totalSales = Number(srcSalesSummary.totalSales ?? srcSalesSummary.total_sales ?? 0) || 0;

    // prefer explicit revenue in salesByDate
    const hasRevenueInSalesByDate = (srcSalesByDate || []).some((item: any) =>
      ['revenue', 'value', 'amount', 'sales', 'total'].some(k => (k in item) && Number(String(item[k]).replace(/[^\d.\-]/g, '')) !== 0)
    );
    if (hasRevenueInSalesByDate) {
      const data = (srcSalesByDate || []).map((it: any) => ({
        period: it.period ?? it.date ?? it.label ?? '',
        revenue: Number(it.revenue ?? it.value ?? it.amount ?? it.total ?? 0),
      }));
      const sorted = data.sort((a,b) => a.period.localeCompare(b.period));
      const series = [{ name: 'Revenue', color: brandColors.primary, data: sorted.map(d => ({ x: d.period, y: d.revenue })) }];
      return { chartData: sorted, chartSeries: series, usedSource: 'salesByDate', usedStrategy: 'salesByDate.revenue' };
    }

    // aggregate from orders if present
    if ((srcOrders || []).length > 0) {
      const map: Record<string, number> = {};
      for (const o of srcOrders) {
        const date =
          (o?.date && String(o.date).slice(0, 10)) ||
          (o?.created_at && String(o.created_at).slice(0, 10)) ||
          (o?.period && String(o.period).slice(0, 10)) ||
          '';
        const amt = Number(o.total ?? o.total_amount ?? o.amount ?? o.payable ?? o.value ?? 0) || 0;
        const key = date || 'unknown';
        map[key] = (map[key] || 0) + amt;
      }
      const data = Object.keys(map).sort().map(period => ({ period, revenue: Math.round((map[period] || 0) * 100) / 100 }));
      const series = [{ name: 'Revenue', color: brandColors.primary, data: data.map(d => ({ x: d.period, y: d.revenue })) }];
      return { chartData: data, chartSeries: series, usedSource: 'orders', usedStrategy: 'aggregate.orders' };
    }

    // proportional distribution by orders counts (your case)
    const periodsRaw = (srcSalesByDate || []).map((it: any) => ({
      period: it.period ?? it.date ?? it.label ?? '',
      ordersCount: Number(it.orders ?? it.count ?? it.qty ?? 0),
    })).filter((p: any) => !!p.period);

    if (periodsRaw.length > 0) {
      const totalOrders = periodsRaw.reduce((s: number, p: any) => s + (p.ordersCount || 0), 0);
      const totalPaise = Math.round(totalSales * 100);
      if (totalOrders > 0) {
        const allocs = periodsRaw.map(p => ({
          period: p.period,
          orders: p.ordersCount,
          paise: Math.floor((p.ordersCount / totalOrders) * totalPaise),
        }));
        const allocatedPaise = allocs.reduce((s,a) => s + a.paise, 0);
        let remainder = totalPaise - allocatedPaise;
        if (remainder !== 0) {
          let maxIdx = 0;
          for (let i = 1; i < allocs.length; i++) {
            if ((allocs[i].orders || 0) > (allocs[maxIdx].orders || 0)) maxIdx = i;
          }
          allocs[maxIdx].paise += remainder;
        }
        const data = allocs
          .map(a => ({ period: a.period, revenue: a.paise / 100 }))
          .sort((a,b) => a.period.localeCompare(b.period));
        const series = [{ name: 'Revenue', color: brandColors.primary, data: data.map(d => ({ x: d.period, y: d.revenue })) }];
        return { chartData: data, chartSeries: series, usedSource: 'salesByDate(orders)', usedStrategy: 'proportional.paise_alloc' };
      }
      // even split fallback
      const perPaise = Math.round((totalSales * 100) / periodsRaw.length);
      const dataEven = periodsRaw.map(p => ({ period: p.period, revenue: perPaise / 100 })).sort((a,b) => a.period.localeCompare(b.period));
      const seriesEven = [{ name: 'Revenue', color: brandColors.primary, data: dataEven.map(d => ({ x: d.period, y: d.revenue })) }];
      return { chartData: dataEven, chartSeries: seriesEven, usedSource: 'salesByDate', usedStrategy: 'even_split' };
    }

    // nothing found -> empty series (no noisy warnings)
    return { chartData: [], chartSeries: [{ name: 'Revenue', color: brandColors.primary, data: [] }], usedSource: 'none', usedStrategy: 'empty' };
  }, [salesByDate, orders, salesSummary]);

  // hold ready chart data in state to prevent initial empty-chart render
  const [readyChartData, setReadyChartData] = useState<any[] | null>(null);
  const [readyChartSeries, setReadyChartSeries] = useState<any[] | null>(null);
  const prevChartJsonRef = useRef<string | null>(null);

  useEffect(() => {
    // Only set when we actually have non-empty chartData and it's different from previous
    try {
      const json = JSON.stringify(chartData || []);
      if (chartData && chartData.length > 0 && prevChartJsonRef.current !== json) {
        setReadyChartData(chartData);
        setReadyChartSeries(chartSeries);
        prevChartJsonRef.current = json;
        // minimal confirmation log
        // eslint-disable-next-line no-console
        console.info('[Reports] readyChartData set', { chartData, chartSeries, usedSource, usedStrategy });
      }
    } catch (e) {
      // ignore JSON issues
    }
  }, [chartData, chartSeries, usedSource, usedStrategy]);

  // compute validation only from ready data
  const computedSum = (readyChartData || []).reduce((a: number, d: any) => a + Number(d.revenue || 0), 0);
  const kpiTotal = Number(salesSummary.totalSales ?? salesSummary.total_sales ?? 0);
  const mismatch = readyChartData ? Math.abs(computedSum - kpiTotal) > 0.005 : false;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{moneyFmt(kpiTotal)}</p>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Net Sales</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{moneyFmt(Number(salesSummary.netSales || salesSummary.net_sales || 0))}</p>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Tax</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{moneyFmt(Number(salesSummary.totalTax || salesSummary.total_tax || 0))}</p>
      </div>

      {mismatch && (
        <div className="md:col-span-3 text-sm text-red-600">
          Warning: computed series sum ({moneyFmt(computedSum)}) ≠ KPI total ({moneyFmt(kpiTotal)}). Source: {usedSource}. Strategy: {usedStrategy}. Check console.
        </div>
      )}

      <div className="md:col-span-3">
        {(!readyChartData || readyChartData.length === 0) ? (
          <div className="p-6 bg-white rounded shadow text-sm text-gray-600">Preparing chart…</div>
        ) : (
          <LineChartCard
            key={`chart-${JSON.stringify(readyChartData)}`}
            data={readyChartData}
            label="Revenue over time"
            yKey="revenue"
            xKey="period"
            series={readyChartSeries || []}
            loading={false}
            palette={{ primary: brandColors.primary }}
            yFormatter={(v: number) => moneyFmt(v)}
            tooltipFormatter={(v: number) => moneyFmt(v)}
            height={260}
          />
        )}
      </div>
    </div>
  );
};

export default SalesSummary;
