import React from 'react';
import AdminShell from '../components/AdminShell';

const AdminDashboard = () => {
  return (
    <AdminShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">₹0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Pending Orders</h3>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Completed Orders</h3>
          <p className="text-3xl font-bold text-gray-800">0</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Orders Over Time</h3>
          {/* TODO: Replace with a proper chart library */}
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Line Chart Placeholder</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Payment Methods</h3>
          {/* TODO: Replace with a proper chart library */}
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Pie Chart Placeholder</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;