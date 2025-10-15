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

export function BorrowChart({ data, isLoading }: BorrowChartProps) {
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
  const groupedData: Record<string, Record<string, number>> = {};
  const symbols = new Set<string>();

  data.forEach((item) => {
    const date = new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const symbol = item.loan_symbol;
    const amountUsd = parseFloat(item.borrow_amount_usd || '0');

    symbols.add(symbol);

    if (!groupedData[date]) {
      groupedData[date] = {};
    }

    groupedData[date][symbol] = (groupedData[date][symbol] || 0) + amountUsd;
  });

  // Convert to chart data format
  const chartData = Object.keys(groupedData).map((date) => ({
    date,
    ...groupedData[date],
  }));

  const symbolArray = Array.from(symbols);

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
}
