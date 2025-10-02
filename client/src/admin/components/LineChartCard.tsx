// client/src/admin/components/LineChartCard.tsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export type LinePoint = {
  period: string;
  orders?: number;
  revenue?: number | string;
  [k: string]: any;
};

type Props = {
  data?: LinePoint[];
  label?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  xKey?: string;
  yKey?: string;
};

export default function LineChartCard({
  data = [],
  label = 'Chart',
  loading = false,
  error = null,
  height = 240,
  xKey = 'period',
  yKey = 'orders',
  palette = { primary: '#3b82f6' }, // Default to blue
}: Props & { palette?: { primary?: string } }) {
  const sanitized = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d) => ({
      ...d,
      // normalize numeric values so recharts can render consistently
      [yKey]: typeof d[yKey] === 'string' ? Number(d[yKey]) || 0 : d[yKey] ?? 0,
      [xKey]: typeof d[xKey] === 'string' ? d[xKey] : String(d[xKey]),
    }));
  }, [data, xKey, yKey]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm min-h-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-800">{label}</h3>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
      </div>

      {error ? (
        <div className="text-sm text-red-600 p-4 border border-red-100 rounded">
          <strong>Error:</strong> {error}
        </div>
      ) : !loading && sanitized.length === 0 ? (
        <div className="text-sm text-gray-500 p-6">No data to display.</div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <LineChart data={sanitized}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={palette.primary || '#3b82f6'}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
