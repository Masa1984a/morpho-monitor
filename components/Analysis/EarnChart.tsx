'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EarnData {
  day: string;
  vault_address: string;
  vault_symbol: string;
  vault_asset: string;
  vault_asset_symbol: string;
  conversion_rate: string;
  delta_assets: string;
  delta_shares: string;
  total_shares: string;
  tvl_usd: string | null;
  created_at: string;
  updated_at: string;
}

interface EarnChartProps {
  data: EarnData[];
  isLoading: boolean;
}

// Color mapping for different vault symbols
const VAULT_COLORS: Record<string, string> = {
  'Re7USDC': '#2775ca',
  'Re7WETH': '#627eea',
  'Re7WBTC': '#f7931a',
  'Re7WLD': '#000000',
  'TESTUSDCVAULT': '#f39c12',
};

export function EarnChart({ data, isLoading }: EarnChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Earn</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Earn</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  // Group data by date and vault symbol
  const groupedData: Record<string, Record<string, number>> = {};
  const vaultSymbols = new Set<string>();

  data.forEach((item) => {
    const date = new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const vaultSymbol = item.vault_symbol;
    const tvlUsd = parseFloat(item.tvl_usd || '0');

    vaultSymbols.add(vaultSymbol);

    if (!groupedData[date]) {
      groupedData[date] = {};
    }

    groupedData[date][vaultSymbol] = (groupedData[date][vaultSymbol] || 0) + tvlUsd;
  });

  // Convert to chart data format
  const chartData = Object.keys(groupedData).map((date) => ({
    date,
    ...groupedData[date],
  }));

  const vaultSymbolArray = Array.from(vaultSymbols);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">World Chain Morpho Earn</h3>
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
          {vaultSymbolArray.map((vaultSymbol) => (
            <Bar
              key={vaultSymbol}
              dataKey={vaultSymbol}
              stackId="a"
              fill={VAULT_COLORS[vaultSymbol] || '#8884d8'}
              name={vaultSymbol}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
