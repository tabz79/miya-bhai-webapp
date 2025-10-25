import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import api from '@/services/api'; // Import the API service

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  staff_id: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  notes?: string;
}

interface Staff {
  id: string;
  full_name: string;
}

// No longer needs password, as api service handles authentication
const fetchOrders = async (page: number, limit: number, status?: string, search?: string) => {
  return api.getAdminOrders({ page, limit, status, search });
};

const fetchStaff = async () => {
  // Assuming staff fetching also needs admin privileges, or is public.
  // If it needs admin, we should create an api.getAdminStaff()
  // For now, let's assume it's accessible via authenticated user (admin role enforced by backend)
  // If /api/staff is protected by requireAdmin, this will work.
  const { data, error } = await api.getUserProfile(); // A dummy call to ensure authentication is active
  if (error) throw new Error('Not authenticated as admin to fetch staff.');
  
  const res = await fetch('/api/staff', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('supabase.auth.token')}` // This is a placeholder, should be handled by safeFetch if a dedicated api.getStaff() is made
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch staff');
  }
  return res.json();
};

export function Admin() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  // Removed password state and related login logic, as authentication is now handled by Supabase and requireAdmin middleware

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // The enabled flag now relies on successful Supabase authentication, which is implicit
  // when api calls are made. If the user is not authenticated or not admin, the backend
  // will return 401/403, which safeFetch will convert to an error.
  const { data: ordersData, isLoading: isLoadingOrders, error: ordersError } = useQuery({
    queryKey: ['orders', page, limit, statusFilter, searchQuery],
    queryFn: () => fetchOrders(page, limit, statusFilter, searchQuery),
    // No explicit 'enabled' needed here, as the API call itself will handle auth checks
    keepPreviousData: true,
  });

  const { data: staffData, isLoading: isLoadingStaff, error: staffError } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
    // No explicit 'enabled' needed here
  });

  // Removed handleLogin function

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedStaffId) return;

    try {
      await api.assignDriverToOrder(selectedOrder.id, selectedStaffId);

      toast({
        title: 'Driver Assigned',
        description: `Order ${selectedOrder.id} assigned to ${staffData?.find(s => s.id === selectedStaffId)?.full_name}.`,
      });
      queryClient.invalidateQueries(['orders']);
      setIsAssignDialogOpen(false);
      setSelectedOrder(null);
      setSelectedStaffId('');
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Could not assign driver.',
        variant: 'destructive',
      });
    }
  };

  // Removed conditional rendering for login, as auth is now global via Supabase
  // If not authenticated or not admin, the queries will error out and display that.

  if (isLoadingOrders || isLoadingStaff) return <div className="container mx-auto p-4">Loading...</div>;
  if (ordersError) return <div className="container mx-auto p-4 text-red-500">Error loading orders: {ordersError.message}</div>;
  if (staffError) return <div className="container mx-auto p-4 text-red-500">Error loading staff: {staffError.message}</div>;

  const orders = ordersData?.items || [];
  const totalOrders = ordersData?.total || 0;
  const totalPages = Math.ceil(totalOrders / limit);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel - Orders</h1>

      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Search by order ID, customer name, phone..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value || undefined)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter || ''}
          onValueChange={(value) => setStatusFilter(value === '' ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => queryClient.invalidateQueries(['orders'])}>Refresh</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">No orders found.</TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {order.customer_name}
                  <br />
                  {order.customer_phone}
                </TableCell>
                <TableCell>{order.delivery_address}</TableCell>
                <TableCell>
                  {order.items.map((item, index) => (
                    <div key={index}>{item.name} (x{item.quantity})</div>
                  ))}
                </TableCell>
                <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{staffData?.find(s => s.id === order.staff_id)?.full_name || 'Unassigned'}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setSelectedStaffId(order.staff_id || '');
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    Assign Driver
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver to Order {selectedOrder?.id.substring(0, 8)}...</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staff" className="text-right">
                Driver
              </Label>
              <Select
                value={selectedStaffId}
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {staffData?.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                defaultValue={selectedOrder?.notes || ''}
                className="col-span-3"
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignDriver}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}