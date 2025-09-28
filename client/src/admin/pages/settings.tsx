import React from 'react';
import AdminShell from '../components/AdminShell';

const AdminSettingsPage = () => {
  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <p>Admin panel settings will be managed here.</p>
      </div>
    </AdminShell>
  );
};

export default AdminSettingsPage;