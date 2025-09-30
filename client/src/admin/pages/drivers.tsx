// client/src/admin/pages/drivers.tsx
import React, { useEffect, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminApi, fetchDrivers } from '../services/api';
import type { Driver } from '../types';

const blankDriver = { name: '', phone: '', status: 'active' } as Partial<Driver>;

const AdminDriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add-driver modal state
  const [isAddOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<Partial<Driver>>(blankDriver);
  const [formError, setFormError] = useState<string | null>(null);

  // helper to notify other parts of the app (orders/deliveries) that data changed
  const notifyUpdates = () => {
    try {
      window.dispatchEvent(new CustomEvent('miya:refresh-deliveries'));
      window.dispatchEvent(new CustomEvent('miya:refresh-orders'));
    } catch (e) {
      console.warn('notifyUpdates failed', e);
    }
  };

  // Fetch drivers
  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchDrivers(); // alias to adminApi.getDrivers
      // fetchDrivers returns array or normalized shape; guard both
      const list: Driver[] = Array.isArray(resp) ? resp : (resp?.data ?? resp ?? []);
      setDrivers(list);
    } catch (err: any) {
      console.error('loadDrivers failed', err);
      setError(err?.message || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // create driver
  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError(null);

    // Basic validation
    if (!form.name || !form.name.trim()) return setFormError('Name is required');
    if (!form.phone || !String(form.phone).trim()) return setFormError('Phone is required');

    setLoadingAction(true);
    try {
      const newDriver = await adminApi.createDriver?.(
        { name: String(form.name).trim(), phone: String(form.phone).trim(), status: (form.status as any) ?? 'active' }
      );
      // push to list
      setDrivers((prev) => [newDriver, ...prev]);
      setForm(blankDriver);
      setAddOpen(false);

      // notify other parts of the app (deliveries/orders)
      notifyUpdates();
    } catch (err: any) {
      console.error('createDriver failed', err);
      // prefer server-provided message if available
      setFormError(err?.message || 'Failed to create driver');
    } finally {
      setLoadingAction(false);
    }
  };

  // toggle active/inactive
  const toggleStatus = async (d: Driver) => {
    const nextStatus = d.status === 'active' ? 'inactive' : 'active';
    setLoadingAction(true);
    setError(null);
    try {
      const updated = await adminApi.updateDriver?.(d.id, { status: nextStatus });
      setDrivers((prev) => prev.map(p => p.id === d.id ? (updated ?? { ...p, status: nextStatus }) : p));

      // notify other parts of the app (deliveries/orders) so assignment UIs update
      notifyUpdates();
    } catch (err: any) {
      console.error('updateDriver failed', err);
      setError(err?.message || 'Failed to update driver');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Drivers</h2>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => { setForm(blankDriver); setFormError(null); setAddOpen(true); }}
              className="bg-[#ae905c] text-white px-4 py-2 rounded-md hover:bg-[#9c7f4c]"
            >
              Add Driver
            </button>
            {loading && <div className="text-sm text-gray-500">Loading…</div>}
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

        <div className="overflow-x-auto">
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
              {drivers.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-sm text-gray-500">No drivers found.</td>
                </tr>
              )}

              {drivers.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-2">{d.name}</td>
                  <td className="p-2">{d.phone}</td>
                  <td className="p-2">
                    <span className={`py-1 px-3 rounded-full text-xs ${d.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleStatus(d)}
                      disabled={loadingAction}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {d.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => { /* TODO: open edit modal if needed */ }}
                      className="text-sm text-gray-600 hover:underline ml-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow">
            <h3 className="text-lg font-medium mb-4">Add Driver</h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  value={form.name ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-1 block w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  className="mt-1 block w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status ?? 'active'}
                  onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as 'active' | 'inactive' }))}
                  className="mt-1 block w-full border rounded px-3 py-2"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>

              {formError && <div className="text-sm text-red-600">{formError}</div>}

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setAddOpen(false); setForm(blankDriver); }} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" disabled={loadingAction} className="bg-[#ae905c] text-white px-4 py-2 rounded">
                  {loadingAction ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default AdminDriversPage;
