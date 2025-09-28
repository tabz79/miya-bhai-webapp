import React from 'react';
import { Order } from '@/lib/admin-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from 'lucide-react';
import { Card } from "@/components/ui/card";

// Mock data for design purposes
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    createdAt: new Date().toISOString(),
    status: 'NEW',
    paymentStatus: 'paid',
    paymentMethod: 'Prepaid',
    customer: { id: 'CUST-01', name: 'John Doe', phone: '123-456-7890' },
    totals: { subtotal: 100, discount: 0, tax: 5, total: 105 },
    items: [],
  },
  {
    id: 'ORD-002',
    createdAt: new Date().toISOString(),
    status: 'PREPARING',
    paymentStatus: 'pending',
    paymentMethod: 'COD',
    customer: { id: 'CUST-02', name: 'Jane Smith', phone: '987-654-3210' },
    totals: { subtotal: 200, discount: 20, tax: 9, total: 189 },
    items: [],
  },
];

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const statusColors = {
    NEW: 'bg-blue-500',
    ACCEPTED: 'bg-yellow-500',
    PREPARING: 'bg-orange-500',
    OUT_FOR_DELIVERY: 'bg-indigo-500',
    COMPLETED: 'bg-green-500',
    CANCELED: 'bg-red-500',
  };
  return <Badge className={`${statusColors[status]} text-white`}>{status}</Badge>;
};

export const OrdersPage = () => {
  // State for slide-over panel would go here
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button>Create Order</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Input placeholder="Search by Order ID or Customer..." className="max-w-sm" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-[180px]" />
      </div>

      {/* Orders Table */}
      <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell className="text-right">₹{order.totals.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>

      {/* TODO: Implement slide-over detail panel */}
      {selectedOrder && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg z-50 p-6 overflow-y-auto">
              <h2 className="text-xl font-bold">Order {selectedOrder.id}</h2>
              <p>Details for the selected order would go here.</p>
              <Button onClick={() => setSelectedOrder(null)} className="mt-4">Close</Button>
          </div>
      )}
    </div>
  );
};