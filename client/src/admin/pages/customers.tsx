import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';

// TODO: Define the Customer type based on the API contract
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderHistory: string[];
};

// TODO: API contract for fetching customers
async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch('/api/customers');
  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }
  return response.json();
}

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    // fetchCustomers().then(setCustomers);
  }, []);

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Customers</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: Replace with real data from the API */}
            <tr className="border-b">
              <td className="p-2">John Doe</td>
              <td className="p-2">john.doe@example.com</td>
              <td className="p-2">123-456-7890</td>
              <td className="p-2">
                <button className="text-blue-500 hover:underline">View Profile</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
};

export default AdminCustomersPage;