
import React, { useState, useEffect } from 'react';

export function Staff() {
  const [orders, setOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        // This endpoint does not exist yet, we will assume it will be created
        const response = await fetch(`/api/staff/${staffId}/orders`);
        const data = await response.json();
        setOrders(data);
      };

      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, staffId]);

  const handleLogin = () => {
    // In a real app, you'd use a more secure authentication method
    if (staffId) {
      setIsAuthenticated(true);
    }
  };

  const handleStatusChange = async (orderId, status, collectedAmount) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, collectedAmount, collectedBy: staffId }),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-app-background flex items-center justify-center">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Staff Login</h1>
          <input type="text" placeholder="Enter Staff ID" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mb-4" />
          <button onClick={handleLogin} className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 text-gray-800 p-4">
      <h1 className="text-3xl font-bold mb-4">My Assigned Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Order #{order.id.slice(0, 8)}</h2>
              <span className={`px-2 py-1 text-sm font-semibold rounded-full`}>{order.status}</span>
            </div>
            <div className="mt-4">
              <p><strong>Customer:</strong> {order.customer.name}</p>
              <p><strong>Phone:</strong> <a href={`tel:${order.customer.phone}`} className="text-blue-500">{order.customer.phone}</a></p>
              <p><strong>Address:</strong> {order.customer.address}</p>
              <p><strong>Total:</strong> ₹{order.totals.total.toFixed(2)}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              {order.status === 'ACCEPTED' && (
                <button onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Out for Delivery</button>
              )}
              {order.status === 'OUT_FOR_DELIVERY' && (
                <button onClick={() => handleStatusChange(order.id, 'COMPLETED', order.totals.total)} className="bg-green-500 text-white px-4 py-2 rounded-lg">Mark as Delivered & Collected</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
