import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import OrderDetailsSlideOver from '../components/OrderDetailsSlideOver';

// TODO: Define the Order type based on the API contract
type Order = {
  id: string;
  customer: string;
  date: string;
  status: 'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';
  total: number;
};

// TODO: API contract for fetching orders
async function fetchOrders(page: number, limit: number, status: string, search: string): Promise<{ orders: Order[], total: number }> {
  const response = await fetch(`/api/orders?page=${page}&limit=${limit}&status=${status}&search=${search}`);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSlideOverOpen, setSlideOverOpen] = useState(false);

  // TODO: Implement server-side pagination, filtering, and searching
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch orders when component mounts or dependencies change
    // fetchOrders(currentPage, 10, statusFilter, searchQuery).then(data => {
    //   setOrders(data.orders);
    //   setTotalPages(Math.ceil(data.total / 10));
    // });
  }, [currentPage, statusFilter, searchQuery]);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setSlideOverOpen(true);
  };

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Orders</h2>
          {/* Add filter and search controls here */}
        </div>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Order ID</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: Replace with real data from the API */}
            <tr className="border-b hover:bg-gray-100 cursor-pointer" onClick={() => handleRowClick({ id: '123', customer: 'John Doe', date: '2025-09-28', status: 'Pending', total: 100 })}> 
              <td className="p-2">#123</td>
              <td className="p-2">John Doe</td>
              <td className="p-2">2025-09-28</td>
              <td className="p-2"><span className="bg-yellow-200 text-yellow-800 py-1 px-3 rounded-full text-xs">Pending</span></td>
              <td className="p-2 text-right">₹100.00</td>
            </tr>
          </tbody>
        </table>
        {/* TODO: Add pagination controls */}
      </div>
      {selectedOrder && (
        <OrderDetailsSlideOver
          order={selectedOrder}
          isOpen={isSlideOverOpen}
          onClose={() => setSlideOverOpen(false)}
        />
      )}
    </AdminShell>
  );
};

export default AdminOrdersPage;