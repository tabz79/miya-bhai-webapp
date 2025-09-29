// client/src/admin/services/api.ts

import { Order, Driver, Customer, Summary, ChartData } from '../types'; // Assuming these types exist or will be created

const API_BASE_URL = '/api/admin'; // Adjust if your API base path is different

export const adminApi = {
  getSummary: async (): Promise<Summary> => {
    const response = await fetch(`${API_BASE_URL}/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getOrdersOverTime: async (from: string, to: string, interval: 'day' | 'week' | 'month'): Promise<ChartData[]> => {
    const response = await fetch(`${API_BASE_URL}/charts/orders-over-time?from=${from}&to=${to}&interval=${interval}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  },

  getPaymentMethods: async (): Promise<ChartData[]> => {
    const response = await fetch(`${API_BASE_URL}/charts/payment-methods`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  },

  getOrders: async (page: number, limit: number, status?: string, search?: string): Promise<{ items: Order[]; total: number }> => {
    let url = `${API_BASE_URL}/orders?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${search}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { items: data.data, total: data.meta.total };
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.order;
  },

  assignDriverToOrder: async (orderId: string, driverId: string | null): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.order;
  },

  getDrivers: async (): Promise<Driver[]> => {
    const response = await fetch(`${API_BASE_URL}/drivers`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  },

  createDriver: async (driver: Omit<Driver, 'id'>): Promise<Driver> => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.driver;
  },

  updateDriver: async (driverId: string, driver: Partial<Driver>): Promise<Driver> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.driver;
  },

  deleteDriver: async (driverId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },

  getDeliveries: async (): Promise<any[]> => { // TODO: Define Delivery type
    const response = await fetch(`${API_BASE_URL}/deliveries`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  },

  getCustomers: async (): Promise<Customer[]> => {
    const response = await fetch(`${API_BASE_URL}/customers`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  },

  getCustomerById: async (customerId: string): Promise<{ customer: Customer; orders: Order[] }> => {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  exportReports: async (from?: string, to?: string, status?: string): Promise<Blob> => {
    let url = `${API_BASE_URL}/reports/export`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.blob();
  },
};