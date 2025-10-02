import React, { useState, useEffect } from 'react';

type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  last_order_at: string | null;
};

type Order = {
  id: string;
  created_at: string;
  total: number;
  status: string;
};

type CustomerDrawerProps = {
  customerId: string | null;
  onClose: () => void;
};

const CustomerDrawer: React.FC<CustomerDrawerProps> = ({ customerId, onClose }) => {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchCustomerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCustomer(data.customer);
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId]);

  if (!customerId) return null; // Don't render if no customer is selected

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Customer Details</h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      {/* Heroicon name: outline/x */}
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-6 flex-1">
                {loading && <p>Loading customer details...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}
                {!loading && !error && customer && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-900">Total Spent: ${customer.total_spent ? customer.total_spent.toFixed(2) : '0.00'}</p>
                      <p className="text-sm font-medium text-gray-900">Last Order: {customer.last_order_at ? new Date(customer.last_order_at).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Recent Orders</h4>
                      {orders.length === 0 ? (
                        <p className="text-sm text-gray-500">No recent orders.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {orders.map((order) => (
                            <li key={order.id} className="py-3 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order #{order.id.substring(0, 8)}</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{order.status}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerDrawer;
