'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CollateralData {
  day: string;
  collateral_token: string;
  collateral_symbol: string;
  collateral_amount: string;
  collateral_amount_usd: string | null;
  created_at: string;
  updated_at: string;
}

interface CollateralChartProps {
  data: CollateralData[];
  isLoading: boolean;
}

// Color mapping for different collateral symbols
const SYMBOL_COLORS: Record<string, string> = {
  'WETH': '#627eea',
  'WLD': '#000000',
  'WBTC': '#f7931a',
  'ezETH': '#9b59b6',
};

export function CollateralChart({ data, isLoading }: CollateralChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Collateral</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Collateral</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  // Group data by date and symbol
  const groupedData: Record<string, { isoDate: string; data: Record<string, number> }> = {};
  const symbols = new Set<string>();

  data.forEach((item) => {
    const isoDate = item.day;
    const date = new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const symbol = item.collateral_symbol;
    const amountUsd = parseFloat(item.collateral_amount_usd || '0');

    symbols.add(symbol);

    if (!groupedData[date]) {
      groupedData[date] = { isoDate, data: {} };
    }

    groupedData[date].data[symbol] = (groupedData[date].data[symbol] || 0) + amountUsd;
  });

  // Convert to chart data format and sort by date (oldest to newest)
  const chartData = Object.keys(groupedData)
    .map((date) => ({
      date,
      isoDate: groupedData[date].isoDate,
      ...groupedData[date].data,
    }))
    .sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());

  const symbolArray = Array.from(symbols);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">World Chain Morpho Collateral</h3>
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
