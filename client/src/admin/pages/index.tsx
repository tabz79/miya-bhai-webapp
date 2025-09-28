import React, { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { fetchAdminSummary, fetchOrdersOverTime, fetchPaymentMethods } from '../services/api';
import LineChartCard from '../components/LineChartCard';
import PieChartCard from '../components/PieChartCard';

type Summary = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

type OrdersOverTimeData = { date: string; orders: number }[];
type PaymentMethodsData = { name: string; value: number }[];

const StatCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  const [ordersOverTimeData, setOrdersOverTimeData] = useState<OrdersOverTimeData>([]);
  const [loadingOrdersOverTime, setLoadingOrdersOverTime] = useState(true);
  const [errorOrdersOverTime, setErrorOrdersOverTime] = useState<string | null>(null);

  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodsData>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [errorPaymentMethods, setErrorPaymentMethods] = useState<string | null>(null);

  // Fetch Summary Data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      setLoadingSummary(true);
      setErrorSummary(null);
      try {
        const data = await fetchAdminSummary(signal);
        setSummary({
          totalRevenue: data.totalRevenue ?? 0,
          totalOrders: data.totalOrders ?? 0,
          pendingOrders: data.pendingOrders ?? 0,
          completedOrders: data.completedOrders ?? 0,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Summary fetch aborted');
        } else {
          console.warn('Failed to load admin summary', err);
          setErrorSummary('Unable to load dashboard summary.');
        }
      } finally {
        setLoadingSummary(false);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, []);

  // Fetch Orders Over Time Data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      setLoadingOrdersOverTime(true);
      setErrorOrdersOverTime(null);
      try {
        const data = await fetchOrdersOverTime(undefined, signal);
        setOrdersOverTimeData(data);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Orders over time fetch aborted');
        } else {
          console.warn('Failed to load orders over time data', err);
          setErrorOrdersOverTime('Unable to load orders over time chart.');
        }
      } finally {
        setLoadingOrdersOverTime(false);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, []);

  // Fetch Payment Methods Data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      setLoadingPaymentMethods(true);
      setErrorPaymentMethods(null);
      try {
        const data = await fetchPaymentMethods(undefined, signal);
        setPaymentMethodsData(data);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Payment methods fetch aborted');
        } else {
          console.warn('Failed to load payment methods data', err);
          setErrorPaymentMethods('Unable to load payment methods chart.');
        }
      } finally {
        setLoadingPaymentMethods(false);
      }
    })();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <AdminShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={loadingSummary ? 'Loading…' : `₹${summary?.totalRevenue ?? 0}`} />
        <StatCard title="Total Orders" value={loadingSummary ? 'Loading…' : summary?.totalOrders ?? 0} />
        <StatCard title="Pending Orders" value={loadingSummary ? 'Loading…' : summary?.pendingOrders ?? 0} />
        <StatCard title="Completed Orders" value={loadingSummary ? 'Loading…' : summary?.completedOrders ?? 0} />
      </div>

      {errorSummary && <div className="mt-4 text-sm text-red-600">{errorSummary}</div>}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Orders Over Time"
          data={ordersOverTimeData}
          loading={loadingOrdersOverTime}
          error={errorOrdersOverTime}
        />
        <PieChartCard
          title="Payment Methods"
          data={paymentMethodsData}
          loading={loadingPaymentMethods}
          error={errorPaymentMethods}
        />
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
