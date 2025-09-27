
import React, { useState, useEffect } from 'react';

export function Admin() {
  const [orders, setOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        const response = await fetch('/api/orders');
        const data = await response.json();
        setOrders(data);
      };

      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // In a real app, you'd use a more secure authentication method
    if (password === (import.meta.env.VITE_ADMIN_SECRET || 'password')) {
      setIsAuthenticated(true);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-app-background flex items-center justify-center">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-tobacco transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-app-background text-app-foreground p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Order #{order.id.slice(0, 8)}</h2>
              <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                {
                  pending: 'bg-yellow-200 text-yellow-800',
                  paid: 'bg-green-200 text-green-800',
                  preparing: 'bg-blue-200 text-blue-800',
                  ready: 'bg-purple-200 text-purple-800',
                  completed: 'bg-gray-200 text-gray-800',
                }[order.status]
              }`}>
                {order.status}
              </span>
            </div>
            <div className="mt-4">
              <p><strong>Customer:</strong> {order.customer.name}</p>
              <p><strong>Total:</strong> ₹{order.totals.total.toFixed(2)}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <select 
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
