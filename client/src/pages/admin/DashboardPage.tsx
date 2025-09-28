
import React from 'react';
import { KpiCardData, TimeSeriesData, PaymentBreakdownData } from '@/lib/admin-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown } from 'lucide-react';

// Mock data for design purposes - in a real app, this would come from props/API
const kpiData: KpiCardData[] = [
  { title: 'Total Revenue', value: '₹1,25,430', change: '+12.5%', changeType: 'increase' },
  { title: 'Total Orders', value: '845', change: '+8.2%', changeType: 'increase' },
  { title: 'Pending Orders', value: '21', change: '-3.1%', changeType: 'decrease' },
  { title: 'New Customers', value: '78', change: '+20.1%', changeType: 'increase' },
];

const KpiCard = ({ data }: { data: KpiCardData }) => {
  const Icon = {
    'Total Revenue': DollarSign,
    'Total Orders': ShoppingCart,
    'Pending Orders': ShoppingCart,
    'New Customers': Users,
  }[data.title];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.value}</div>
        <p className={`text-xs ${data.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
          {data.change} from last month
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map(kpi => <KpiCard key={kpi.title} data={kpi} />)}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Chart library not yet integrated. A line chart would be displayed here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Chart library not yet integrated. A pie chart would be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
