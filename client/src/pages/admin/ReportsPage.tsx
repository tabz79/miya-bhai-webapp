import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export as CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Report" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily Revenue</SelectItem>
            <SelectItem value="weekly">Weekly Revenue</SelectItem>
            <SelectItem value="monthly">Monthly Revenue</SelectItem>
            <SelectItem value="payments">Payment Methods</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-[180px]" />
        <span className="text-gray-500">to</span>
        <Input type="date" className="w-[180px]" />
      </div>

      <Card>
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Report data will be displayed here.</p>
        </div>
      </Card>
    </div>
  );
};