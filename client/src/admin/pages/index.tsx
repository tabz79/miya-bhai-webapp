import React, { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { fetchAdminSummary } from '../services/api';

type Summary = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

const StatCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAdminSummary();
        if (!mounted) return;
        setSummary({
          totalRevenue: data.totalRevenue ?? 0,
          totalOrders: data.totalOrders ?? 0,
          pendingOrders: data.pendingOrders ?? 0,
          completedOrders: data.completedOrders ?? 0,
        });
      } catch (err) {
        console.warn('Failed to load admin summary', err);
        if (mounted) setError('Unable to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={loading ? 'Loading…' : `₹${summary?.totalRevenue ?? 0}`} />
        <StatCard title="Total Orders" value={loading ? 'Loading…' : summary?.totalOrders ?? 0} />
        <StatCard title="Pending Orders" value={loading ? 'Loading…' : summary?.pendingOrders ?? 0} />
        <StatCard title="Completed Orders" value={loading ? 'Loading…' : summary?.completedOrders ?? 0} />
      </div>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Orders Over Time</h3>
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Line Chart Placeholder</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Payment Methods</h3>
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Pie Chart Placeholder</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
