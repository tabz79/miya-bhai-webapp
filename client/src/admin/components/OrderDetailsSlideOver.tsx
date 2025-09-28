import React from 'react';

// TODO: Define the Order type based on the API contract
type Order = {
  id: string;
  customer: string;
  date: string;
  status: 'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Completed' | 'Cancelled';
  total: number;
};

// TODO: API contract for updating an order
async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update order status');
  }
}

// TODO: API contract for assigning a driver
async function assignDriver(orderId: string, driverId: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId }),
  });
  if (!response.ok) {
    throw new Error('Failed to assign driver');
  }
}

const OrderDetailsSlideOver = ({ order, isOpen, onClose }: { order: Order, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full divide-y divide-gray-200 flex flex-col bg-white shadow-xl">
              <div className="flex-1 h-0 overflow-y-auto">
                <header className="px-4 py-6 sm:px-6 bg-[#3c3c3b] text-white">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium">Order #{order.id}</h2>
                    <div className="ml-3 h-7 flex items-center">
                      <button onClick={onClose} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <span className="sr-only">Close panel</span>
                        {/* Heroicon name: x */}
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </header>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="px-4 divide-y divide-gray-200 sm:px-6">
                    {/* Order details */}
                    <div className="py-6">
                      <p><strong>Customer:</strong> {order.customer}</p>
                      <p><strong>Date:</strong> {order.date}</p>
                      <p><strong>Status:</strong> {order.status}</p>
                      <p><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
                    </div>
                    {/* Order items */}
                    <div className="py-6">
                      <h3 className="font-medium text-gray-900">Items</h3>
                      {/* TODO: Display order items here */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 px-4 py-4 flex justify-end space-x-4">
                {/* TODO: Add API calls to these buttons */}
                <select className="border-gray-300 rounded-md">
                  {/* TODO: Populate with drivers from /api/drivers */}
                  <option>Assign Driver</option>
                </select>
                <select className="border-gray-300 rounded-md">
                  <option>Change Status</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button type="button" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Cancel Order</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderDetailsSlideOver;