import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';

// TODO: Define the Delivery type based on the API contract
type Delivery = {
  orderId: string;
  driverId: string;
  driverName: string;
  status: string;
};

// TODO: API contract for fetching deliveries
async function fetchDeliveries(): Promise<Delivery[]> {
  const response = await fetch('/api/deliveries');
  if (!response.ok) {
    throw new Error('Failed to fetch deliveries');
  }
  return response.json();
}

const AdminDeliveryPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    // fetchDeliveries().then(setDeliveries);
  }, []);

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Delivery Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* TODO: Replace with real data from the API */}
          <div className="border p-4 rounded-lg">
            <p><strong>Order:</strong> #123</p>
            <p><strong>Driver:</strong> Test Driver</p>
            <p><strong>Status:</strong> Out for Delivery</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDeliveryPage;