import React from 'react';
import { Driver } from '@/lib/admin-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Mock data for design purposes
const mockDrivers: Driver[] = [
  {
    id: 'DRV-01',
    name: 'Ali Khan',
    phone: '111-222-3333',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    recentOrders: 5,
  },
  {
    id: 'DRV-02',
    name: 'Fatima Ahmed',
    phone: '444-555-6666',
    status: 'INACTIVE',
    createdAt: new Date().toISOString(),
    recentOrders: 0,
  },
];

const StatusBadge = ({ status }: { status: Driver['status'] }) => {
  const statusColors = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-red-500',
    ON_BREAK: 'bg-yellow-500',
  };
  return <Badge className={`${statusColors[status]} text-white`}>{status}</Badge>;
};

export const DriversPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drivers</h1>
        <Button>Add Driver</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orders (24h)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.id}</TableCell>
                <TableCell>{driver.name}</TableCell>
                <TableCell>{driver.phone}</TableCell>
                <TableCell><StatusBadge status={driver.status} /></TableCell>
                <TableCell>{driver.recentOrders}</TableCell>
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