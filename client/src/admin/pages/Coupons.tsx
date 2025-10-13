import React, { useState, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import { adminApi } from '../services/api';

const BRAND_TEAK = '#ae905c';

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Failed to fetch coupons', error);
      alert('Failed to fetch coupons — check the console.');
    }
    setLoading(false);
  };

  const handleOpenModal = (coupon: any = null) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCoupon(null);
    setIsModalOpen(false);
  };

  const handleSave = async (couponData: any) => {
    try {
      // Normalize & coerce fields before sending to API
      const payload: any = {
        ...couponData,
        code: (couponData.code || '').toString().trim().toUpperCase(),
        value: Number(couponData.value),
        max_uses: couponData.max_uses === '' || couponData.max_uses === null
          ? null
          : Number(couponData.max_uses),
        is_active: !!couponData.is_active,
        // keep expires_at as-is (datetime-local string or '')
      };

      if (selectedCoupon) {
        await adminApi.updateCoupon(selectedCoupon.id, payload);
      } else {
        await adminApi.createCoupon(payload);
      }
      await fetchCoupons();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save coupon', error);
      const msg = error?.message || 'Failed to save coupon';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await adminApi.deleteCoupon(id);
        fetchCoupons();
      } catch (error) {
        console.error('Failed to delete coupon', error);
        alert('Failed to delete coupon — check console.');
      }
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateCouponStatus(id, isActive);
      setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: isActive } : c));
    } catch (error) {
      console.error('Failed to update coupon status:', error);
      alert('Failed to update coupon status — check console for details.');
    }
  };

  return (
    <AdminShell>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Coupons</h2>
          <button
            onClick={() => handleOpenModal()}
            style={{ backgroundColor: BRAND_TEAK }}
            className="text-white px-4 py-2 rounded-md"
          >
            Add Coupon
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{coupon.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{coupon.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{coupon.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ToggleSwitch
                        enabled={coupon.is_active}
                        onChange={() => handleToggle(coupon.id, !coupon.is_active)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coupon.uses_count} / {coupon.max_uses ?? '∞'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(coupon)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No coupons yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && <CouponModal coupon={selectedCoupon} onSave={handleSave} onClose={handleCloseModal} />}
    </AdminShell>
  );
};

const CouponModal = ({ coupon, onSave, onClose }: { coupon: any, onSave: (data: any) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percentage',
    value: coupon?.value ?? 0,
    is_active: coupon?.is_active ?? true,
    expires_at: coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
    max_uses: coupon?.max_uses ?? '',
  });
  const [saving, setSaving] = useState(false);

  // Keep form in sync when editing different coupon
  useEffect(() => {
    setFormData({
      code: coupon?.code || '',
      type: coupon?.type || 'percentage',
      value: coupon?.value ?? 0,
      is_active: coupon?.is_active ?? true,
      expires_at: coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
      max_uses: coupon?.max_uses ?? '',
    });
  }, [coupon]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }

    // keep numbers as strings until submit
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{coupon ? 'Edit' : 'Add'} Coupon</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <input type="number" name="value" value={formData.value} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Uses</label>
              <input type="number" name="max_uses" value={formData.max_uses} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="Leave blank for unlimited" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expires At</label>
              <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>

            <div className="flex items-center">
              <input type="checkbox" name="is_active" checked={!!formData.is_active} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50" disabled={saving}>Cancel</button>
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: BRAND_TEAK }}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => {
  return (
    <div
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors duration-200 ease-in-out ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </div>
  );
};

export default CouponsPage;
