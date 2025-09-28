import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';

// TODO: Define the Driver type based on the API contract
type Driver = {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
};

// TODO: API contract for fetching drivers
async function fetchDrivers(): Promise<Driver[]> {
  const response = await fetch('/api/drivers');
  if (!response.ok) {
    throw new Error('Failed to fetch drivers');
  }
  return response.json();
}

const AdminDriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    // fetchDrivers().then(setDrivers);
  }, []);

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Drivers</h2>
          <button className="bg-[#ae905c] text-white px-4 py-2 rounded-md hover:bg-[#9c7f4c]">Add Driver</button>
        </div>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: Replace with real data from the API */}
            <tr className="border-b">
              <td className="p-2">Test Driver</td>
              <td className="p-2">123-456-7890</td>
              <td className="p-2"><span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">active</span></td>
              <td className="p-2">
                <button className="text-blue-500 hover:underline">Edit</button>
                <button className="text-red-500 hover:underline ml-4">Deactivate</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
};

export default AdminDriversPage;