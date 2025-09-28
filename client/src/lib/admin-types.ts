
// Data contracts for Admin Panel API

export interface Order {
  id: string;
  createdAt: string;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELED';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'COD' | 'Prepaid';
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  driver?: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    zip: string;
  };
}

export interface Driver {
  id: string;
  name:string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_BREAK';
  vehicleId?: string;
  createdAt: string;
  recentOrders: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface KpiCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

export interface TimeSeriesData {
  date: string;
  orders: number;
}

export interface PaymentBreakdownData {
  method: string;
  count: number;
}

