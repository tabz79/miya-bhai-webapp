// client/src/admin/types.ts

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  // Add other order properties as needed
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
  // Add other driver properties as needed
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  // Add other customer properties as needed
}

export interface Summary {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface ChartData {
  name?: string;   // For payment methods
  value?: number;  // For payment methods
  period?: string; // For orders over time
  orders?: number; // For orders over time
}

export interface Delivery {
  id: string;                  // unique id for delivery
  orderId: string;             // internal order id
  orderIdDisplay?: string;     // user-facing short id
  status: 'PENDING' | 'ASSIGNED' | 'PICKED' | 'DELIVERED' | 'CANCELLED';
  driverId?: string | null;    // driver assigned (nullable)
  driverName?: string;         // redundant display field
  driverPhone?: string;        // redundant display field
  pickupAddress?: string;
  dropoffAddress?: string;
  etaMinutes?: number | null;
  startedAt?: string | null;   // ISO timestamp
  deliveredAt?: string | null; // ISO timestamp
  createdAt?: string;          // ISO timestamp
  updatedAt?: string;          // ISO timestamp
}
