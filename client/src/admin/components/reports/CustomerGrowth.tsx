// client/src/admin/components/reports/CustomerGrowth.tsx
import React from 'react';
import { computeCustomerGrowthFromOrders } from './reportsUtils';

interface CustomerGrowthProps {
  customerGrowth?: { new: number; returning: number } | null;
  loading: boolean;
  orders?: any[];
  rangeStart?: string;
  rangeEnd?: string;
}

const CustomerGrowth: React.FC<CustomerGrowthProps> = ({ customerGrowth, loading, orders = [], rangeStart, rangeEnd }) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  let growth = customerGrowth;
  if (!growth && orders && orders.length > 0) {
    const derived = computeCustomerGrowthFromOrders(orders, rangeStart, rangeEnd);
    growth = { new: derived.newCustomers, returning: derived.returningCustomers };
  }

  if (!growth) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Customer Growth</h3>
        <p className="mt-2 text-sm text-gray-500">Customer growth data not available for this range.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">Customer Growth</h3>
      <div className="mt-1 flex justify-around">
        <div>
          <p className="text-2xl font-semibold text-gray-900">{growth.new}</p>
          <p className="text-sm text-gray-500">New Customers</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-gray-900">{growth.returning}</p>
          <p className="text-sm text-gray-500">Returning Customers</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerGrowth;
