'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DexVolumeData {
  date: string;
  blockchain: string;
  chain_volume_wld: string;
  chain_volume_usd: string;
  chain_num_swaps: number;
  total_volume_wld: string;
  total_volume_usd: string;
  total_num_swaps: number;
  created_at: string;
  updated_at: string;
}

interface DexVolumeChartProps {
  data: DexVolumeData[];
  isLoading: boolean;
}

// Color mapping for different blockchains
const BLOCKCHAIN_COLORS: Record<string, string> = {
  'ethereum': '#627eea',
  'optimism': '#ff0420',
  'worldchain': '#000000',
};

export function DexVolumeChart({ data, isLoading }: DexVolumeChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">WLD DEX Volume</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">WLD DEX Volume</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  // Group data by date and blockchain
  const groupedData: Record<string, { isoDate: string; displayDate: string; data: Record<string, number> }> = {};
  const blockchains = new Set<string>();

  data.forEach((item) => {
    const isoDate = item.date;
    const dateObj = new Date(item.date);

    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', item.date);
      return;
    }

    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const blockchain = item.blockchain;
    const volumeUsd = parseFloat(item.chain_volume_usd || '0');

    // Skip invalid numeric values
    if (isNaN(volumeUsd) || !isFinite(volumeUsd)) {
      console.error('Invalid volume value:', item.chain_volume_usd);
      return;
    }

    blockchains.add(blockchain);

    // Use isoDate as the unique key to prevent date collisions
    if (!groupedData[isoDate]) {
      groupedData[isoDate] = { isoDate, displayDate, data: {} };
    }

    groupedData[isoDate].data[blockchain] = (groupedData[isoDate].data[blockchain] || 0) + volumeUsd;
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

  const blockchainArray = Array.from(blockchains);

  // If no valid data after processing, show no data message
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">WLD DEX Volume</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No valid data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">WLD DEX Volume</h3>
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
          {blockchainArray.map((blockchain) => (
            <Bar
              key={blockchain}
              dataKey={blockchain}
              stackId="a"
              fill={BLOCKCHAIN_COLORS[blockchain] || '#8884d8'}
              name={blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
