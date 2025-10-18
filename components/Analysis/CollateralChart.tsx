'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CollateralData {
  day: string;
  collateral_token: string;
  collateral_symbol: string;
  collateral_amount: string;
  collateral_amount_usd: string | null;
  created_at: string;
  updated_at: string;
}

interface WldPriceData {
  date: string;
  symbol: string;
  close_price: string;
  created_at: string;
  updated_at: string;
}

interface CollateralChartProps {
  data: CollateralData[];
  isLoading: boolean;
  wldPriceData: WldPriceData[];
  isLoadingWldPrice: boolean;
}

// Color mapping for different collateral symbols
const SYMBOL_COLORS: Record<string, string> = {
  'WETH': '#627eea',
  'WLD': '#000000',
  'WBTC': '#f7931a',
  'ezETH': '#9b59b6',
};

export const CollateralChart = React.memo(function CollateralChart({ data, isLoading, wldPriceData, isLoadingWldPrice }: CollateralChartProps) {
  if (isLoading || isLoadingWldPrice) {
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
    const symbol = item.collateral_symbol;
    const amountUsd = parseFloat(item.collateral_amount_usd || '0');

    // Skip invalid numeric values
    if (isNaN(amountUsd) || !isFinite(amountUsd)) {
      console.error('Invalid collateral amount value:', item.collateral_amount_usd);
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

  // Merge WLD price data into chart data
  const wldPriceMap: Record<string, number> = {};
  wldPriceData.forEach((item) => {
    const isoDate = item.date.split('T')[0]; // Extract date part only
    const price = parseFloat(item.close_price || '0');
    if (!isNaN(price) && isFinite(price)) {
      wldPriceMap[isoDate] = price;
    }
  });

  // Add WLD price to chart data
  chartData.forEach((item: any) => {
    const isoDate = item.isoDate.split('T')[0]; // Extract date part only
    item.wldPrice = wldPriceMap[isoDate] || null;
  });

  const symbolArray = Array.from(symbols);

  // If no valid data after processing, show no data message
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">World Chain Morpho Collateral</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No valid data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">World Chain Morpho Collateral</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}m`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'WLD Price') {
                return [`$${value.toFixed(4)}`, name];
              }
              return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
            }}
            labelStyle={{ color: '#000' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {symbolArray.map((symbol) => (
            <Bar
              key={symbol}
              yAxisId="left"
              dataKey={symbol}
              stackId="a"
              fill={SYMBOL_COLORS[symbol] || '#8884d8'}
              name={symbol}
            />
          ))}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="wldPrice"
            stroke="#ff0000"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="WLD Price"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
