import React from 'react';
import AdminShell from '../components/AdminShell';

// TODO: API contract for exporting reports
async function exportReports(format: 'csv' | 'pdf'): Promise<void> {
  const response = await fetch(`/api/reports/export?format=${format}`);
  if (!response.ok) {
    throw new Error('Failed to export reports');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const AdminReportsPage = () => {
  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Financial Reports</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => exportReports('csv')} 
            className="bg-[#ae905c] text-white px-4 py-2 rounded-md hover:bg-[#9c7f4c]"
          >
            Export as CSV
          </button>
          {/* <button 
            onClick={() => exportReports('pdf')} 
            className="bg-[#ae905c] text-white px-4 py-2 rounded-md hover:bg-[#9c7f4c]"
          >
            Export as PDF
          </button> */}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminReportsPage;