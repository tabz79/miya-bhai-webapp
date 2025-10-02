
import React from 'react';

interface OrdersCountProps {
  ordersCount: number;
  loading: boolean;
}

const OrdersCount: React.FC<OrdersCountProps> = ({ ordersCount, loading }) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{ordersCount}</p>
    </div>
  );
};

export default OrdersCount;
