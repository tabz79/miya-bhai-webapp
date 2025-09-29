// client/src/admin/components/PieChartCard.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PaymentMethodsData = { name: string; value: number }[];

interface PieChartCardProps {
  title?: string;
  label?: string; // accept both label and title for flexibility
  data?: PaymentMethodsData;
  loading?: boolean;
  error?: string | null;
  height?: number;
}

const COLORS = ['#ae905c', '#675b46', '#746d52', '#3c3c3b', '#8884d8', '#82ca9d'];

const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  label,
  data = [],
  loading = false,
  error = null,
  height = 300,
}) => {
  const heading = title ?? label ?? 'Chart';

  return (
    <div className="bg-white p-6 rounded-lg shadow min-h-[220px]">
      <h3 className="text-lg font-medium text-gray-800 mb-3">{heading}</h3>

      {loading ? (
        <div className="text-center text-gray-500">Loading chart data...</div>
      ) : error ? (
        <div className="text-center text-red-600">Error: {error}</div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-500">No data available.</div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={Math.min(100, height / 3)}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PieChartCard;
