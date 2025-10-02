// client/src/admin/components/reports/PaymentBreakdown.tsx
import React from 'react';
import PieChartCard from '@/admin/components/PieChartCard';
import { buildPaymentBreakdown } from './reportsUtils';

interface PaymentBreakdownProps {
  paymentBreakdown: any[]; // flexible
  loading: boolean;
  // optional: pass orders or totalSales if component consumer has it
  orders?: any[];
  totalSales?: number;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({ paymentBreakdown = [], loading, orders = [], totalSales = 0 }) => {
  if (loading) return <div>Loading...</div>;

  const series = buildPaymentBreakdown({ orders, breakdown: paymentBreakdown, totalSales });

  // Map to ChartData expected by PieChartCard
  const data = series.map((s: any) => ({ name: s.name, value: Number(s.value || 0) }));

  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
        <p className="text-sm text-gray-500">No payment breakdown available for this range.</p>
      </div>
    );
  }

  return <PieChartCard data={data} title="Payment Method Breakdown" loading={loading} />;
};

export default PaymentBreakdown;
