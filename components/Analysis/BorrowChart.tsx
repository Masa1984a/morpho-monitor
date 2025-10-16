'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BorrowData {
  day: string;
  loan_token: string;
  loan_symbol: string;
  borrow_amount: string;
  borrow_amount_usd: string | null;
  created_at: string;
  updated_at: string;
}

interface BorrowChartProps {
  data: BorrowData[];
  isLoading: boolean;
}

// Color mapping for different loan symbols
const SYMBOL_COLORS: Record<string, string> = {
  'USDC': '#2775ca',
  'USDC.e': '#7f8c8d',
  'WLD': '#000000',
  'WETH': '#627eea',
};

export const BorrowChart = React.memo(function BorrowChart({ data, isLoading }: BorrowChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Borrow</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Borrow</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  // Group data by date and symbol
  const groupedData: Record<string, { isoDate: string; displayDate: string; data: Record<string, number> }> = {};
  const symbols = new Set<string>();

  data.forEach((item) => {
    const isoDate = item.day;
    const dateObj = new Date(item.day);

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', item.day);
      return;
    }

    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const symbol = item.loan_symbol;
    const amountUsd = parseFloat(item.borrow_amount_usd || '0');

    // Skip invalid numeric values
    if (isNaN(amountUsd) || !isFinite(amountUsd)) {
      console.error('Invalid borrow amount value:', item.borrow_amount_usd);
      return;
    }

    symbols.add(symbol);

    // Use isoDate as the unique key to prevent date collisions
    if (!groupedData[isoDate]) {
      groupedData[isoDate] = { isoDate, displayDate, data: {} };
    }

    groupedData[isoDate].data[symbol] = (groupedData[isoDate].data[symbol] || 0) + amountUsd;
  });

  // Convert to chart data format and sort by date (oldest to newest)
  const chartData = Object.keys(groupedData)
    .map((isoDate) => ({
      key: isoDate, // Use isoDate as unique key
      date: groupedData[isoDate].displayDate,
      isoDate: groupedData[isoDate].isoDate,
      ...groupedData[isoDate].data,
    }))
    .sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());

  const symbolArray = Array.from(symbols);

  // If no valid data after processing, show no data message
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Borrow</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No valid data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">World Chain Morpho Borrow</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}m`}
          />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            labelStyle={{ color: '#000' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {symbolArray.map((symbol) => (
            <Bar
              key={symbol}
              dataKey={symbol}
              stackId="a"
              fill={SYMBOL_COLORS[symbol] || '#8884d8'}
              name={symbol}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
