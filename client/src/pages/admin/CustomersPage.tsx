import React from 'react';
import { Customer } from '@/lib/admin-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Mock data for design purposes
const mockCustomers: Customer[] = [
  {
    id: 'CUST-01',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    joinedAt: new Date().toISOString(),
    totalOrders: 5,
    totalSpent: 525,
  },
  {
    id: 'CUST-02',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '987-654-3210',
    joinedAt: new Date().toISOString(),
    totalOrders: 1,
    totalSpent: 189,
  },
];

export const CustomersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
      </div>

      <div className="flex items-center space-x-2">
        <Input placeholder="Search by Name, Email, or Phone..." className="max-w-sm" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.totalOrders}</TableCell>
                <TableCell className="text-right">₹{customer.totalSpent.toFixed(2)}</TableCell>
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
    </div>
  );
};