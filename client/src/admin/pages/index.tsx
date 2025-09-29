// client/src/admin/pages/index.tsx
import React from 'react';
import AdminShell from '../components/AdminShell';
import LineChartCard from '../components/LineChartCard';
import PieChartCard from '../components/PieChartCard';
import { useAdminData } from '../hooks/useAdminData';

const StatCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

export default function AdminDashboard(): JSX.Element {
  const {
    summary,
    ordersOverTime,
    paymentMethods,
    loading,
    error,
    // refetch, fetchPage can be used elsewhere if needed
  } = useAdminData();

  // Map summary fields from hook (Summary shape from useAdminData may differ from old one)
  // we defensively coerce values for display.
  const totalRevenue = summary?.revenue_total ?? summary?.totalRevenue ?? 0;
  const totalOrders = summary?.orders_count ?? summary?.totalOrders ?? 0;
  const pendingOrders = summary?.pending_count ?? summary?.pendingOrders ?? 0;
  const completedOrders = summary?.completed_count ?? summary?.completedOrders ?? 0;

  // Recharts expects data objects: { period, orders, revenue } for LineChartCard
  const lineChartData =
    Array.isArray(ordersOverTime) && ordersOverTime.length
      ? ordersOverTime.map((p) => ({
          period: // ensure human-readable label (date or ISO)
            typeof p.period === 'string' ? p.period : (p.period as any)?.toString?.() ?? String(p.period),
          orders: Number(p.orders ?? p.value ?? 0),
          revenue: String(p.revenue ?? p.amount ?? 0),
        }))
      : [];

  // Pie chart expects { name, value }[]
  const pieData =
    Array.isArray(paymentMethods) && paymentMethods.length
      ? paymentMethods.map((m) => ({ name: String(m.name ?? m.method ?? 'Unknown'), value: Number(m.value ?? m.count ?? 0) }))
      : [];

  return (
    <AdminShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={loading ? 'Loading…' : `₹${Number(totalRevenue ?? 0).toLocaleString()}`} />
        <StatCard title="Total Orders" value={loading ? 'Loading…' : Number(totalOrders ?? 0)} />
        <StatCard title="Pending Orders" value={loading ? 'Loading…' : Number(pendingOrders ?? 0)} />
        <StatCard title="Completed Orders" value={loading ? 'Loading…' : Number(completedOrders ?? 0)} />
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600">
          <strong>Dashboard error:</strong> {String(error)}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          data={lineChartData}
          label="Orders Over Time"
          // if your LineChartCard supports height/xKey/yKey you can pass them too
        />
        <PieChartCard
          data={pieData}
          label="Payment Methods"
        />
      </div>
    </AdminShell>
  );
}
