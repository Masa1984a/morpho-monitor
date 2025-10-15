'use client';

import React, { useState, useEffect } from 'react';
import { CollateralChart } from './CollateralChart';
import { BorrowChart } from './BorrowChart';
import { DexVolumeChart } from './DexVolumeChart';
import { EarnChart } from './EarnChart';

interface AnalysisViewProps {
  walletAddress: string;
}

export function AnalysisView({ walletAddress }: AnalysisViewProps) {
  // Date range state (default: UTC now - 90 days to UTC now)
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    return ninetyDaysAgo.toISOString().split('T')[0];
  });

  // Data state
  const [collateralData, setCollateralData] = useState<any[]>([]);
  const [borrowData, setBorrowData] = useState<any[]>([]);
  const [dexVolumeData, setDexVolumeData] = useState<any[]>([]);
  const [earnData, setEarnData] = useState<any[]>([]);

  // Loading state (start with true to show loading immediately)
  const [isLoadingCollateral, setIsLoadingCollateral] = useState(true);
  const [isLoadingBorrow, setIsLoadingBorrow] = useState(true);
  const [isLoadingDexVolume, setIsLoadingDexVolume] = useState(true);
  const [isLoadingEarn, setIsLoadingEarn] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setError(null);

    // Build query parameters
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    params.append('limit', '1000');

    // Fetch collateral data
    setIsLoadingCollateral(true);
    try {
      const response = await fetch(`/api/morpho-data/collateral?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setCollateralData(result.data || []);
      } else {
        console.error('Failed to fetch collateral data');
      }
    } catch (err) {
      console.error('Error fetching collateral data:', err);
    } finally {
      setIsLoadingCollateral(false);
    }

    // Fetch borrow data
    setIsLoadingBorrow(true);
    try {
      const response = await fetch(`/api/morpho-data/borrow?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setBorrowData(result.data || []);
      } else {
        console.error('Failed to fetch borrow data');
      }
    } catch (err) {
      console.error('Error fetching borrow data:', err);
    } finally {
      setIsLoadingBorrow(false);
    }

    // Fetch DEX volume data
    setIsLoadingDexVolume(true);
    try {
      const response = await fetch(`/api/morpho-data/dex-volume?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setDexVolumeData(result.data || []);
      } else {
        console.error('Failed to fetch DEX volume data');
      }
    } catch (err) {
      console.error('Error fetching DEX volume data:', err);
    } finally {
      setIsLoadingDexVolume(false);
    }

    // Fetch earn data
    setIsLoadingEarn(true);
    try {
      const response = await fetch(`/api/morpho-data/earn?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setEarnData(result.data || []);
      } else {
        console.error('Failed to fetch earn data');
      }
    } catch (err) {
      console.error('Error fetching earn data:', err);
    } finally {
      setIsLoadingEarn(false);
    }
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const handleApplyDateRange = () => {
    fetchData();
  };

  return (
    <div>
      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Date Range</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="from-date" className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              id="from-date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-morpho-blue"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="to-date" className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              id="to-date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-morpho-blue"
            />
          </div>
          <button
            onClick={handleApplyDateRange}
            className="px-4 py-2 bg-morpho-blue text-white rounded-lg text-sm hover:bg-morpho-purple transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        <DexVolumeChart data={dexVolumeData} isLoading={isLoadingDexVolume} />
        <EarnChart data={earnData} isLoading={isLoadingEarn} />
        <BorrowChart data={borrowData} isLoading={isLoadingBorrow} />
        <CollateralChart data={collateralData} isLoading={isLoadingCollateral} />
      </div>
    </div>
  );
}
