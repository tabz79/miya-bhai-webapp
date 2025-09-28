import React, { useState, useEffect } from 'react';

const staff = [
  { id: '1', name: 'Ali' },
  { id: '2', name: 'Fatima' },
];

export function Admin() {
  const [orders, setOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        const response = await fetch('/api/orders', { headers: { Authorization: password } });
        const data = await response.json();
        setOrders(data);
      };

      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  const handleLogin = () => {
    if (password === (import.meta.env.VITE_ADMIN_SECRET || 'password')) {
      setIsAuthenticated(true);
    }
  };

  const handleAssign = async (orderId, staffId) => {
    await fetch(`/api/orders/${orderId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: password },
      body: JSON.stringify({ staffId }),
    });
  };

  const handleStatusChange = async (orderId, status) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: password },
      body: JSON.stringify({ status }),
    });
  };

  const totalRevenue = orders.reduce((acc, order) => acc + (order.collected_amount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-app-background flex items-center justify-center">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mb-4" />
          <button onClick={handleLogin} className="w-full bg-brand-teak text-white px-6 py-3 rounded-lg font-semibold">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 text-gray-800 p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Total Revenue: ₹{totalRevenue.toFixed(2)}</h2>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Order #{order.id.slice(0, 8)}</h2>
              <span className={`px-2 py-1 text-sm font-semibold rounded-full`}>{order.status}</span>
            </div>
            <div className="mt-4">
              <p><strong>Customer:</strong> {order.customer.name}</p>
              <p><strong>Total:</strong> ₹{order.totals.total.toFixed(2)}</p>
              <p><strong>Assigned to:</strong> {staff.find(s => s.id === order.assigned_to)?.name || 'Unassigned'}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <select onChange={(e) => handleAssign(order.id, e.target.value)} className="p-2 border border-gray-300 rounded-md">
                <option value="">Assign to...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select onChange={(e) => handleStatusChange(order.id, e.target.value)} className="p-2 border border-gray-300 rounded-md">
                <option value="">Change status...</option>
                <option value="ACCEPTED">Accept</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Cancel</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}