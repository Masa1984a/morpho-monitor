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

  // Refresh key to force re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Data state
  const [collateralData, setCollateralData] = useState<any[]>([]);
  const [borrowData, setBorrowData] = useState<any[]>([]);
  const [dexVolumeData, setDexVolumeData] = useState<any[]>([]);
  const [earnData, setEarnData] = useState<any[]>([]);
  const [wldPriceData, setWldPriceData] = useState<any[]>([]);

  // Loading state (start with true to show loading immediately)
  const [isLoadingCollateral, setIsLoadingCollateral] = useState(true);
  const [isLoadingBorrow, setIsLoadingBorrow] = useState(true);
  const [isLoadingDexVolume, setIsLoadingDexVolume] = useState(true);
  const [isLoadingEarn, setIsLoadingEarn] = useState(true);
  const [isLoadingWldPrice, setIsLoadingWldPrice] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount and when date range changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingCollateral(true);
        setIsLoadingBorrow(true);
        setIsLoadingDexVolume(true);
        setIsLoadingEarn(true);
        setIsLoadingWldPrice(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);
        const fromDateObj = fromDate ? new Date(fromDate) : null;
        const toDateObj = toDate ? new Date(toDate) : null;
        const isValidRange =
          fromDateObj instanceof Date && !isNaN(fromDateObj.getTime()) &&
          toDateObj instanceof Date && !isNaN(toDateObj.getTime());

        if (isValidRange && fromDateObj && toDateObj) {
          const MS_PER_DAY = 24 * 60 * 60 * 1000;
          const diffMs = Math.max(toDateObj.getTime() - fromDateObj.getTime(), 0);
          const diffDays = Math.floor(diffMs / MS_PER_DAY) + 1;
          // Multiply by 10 to account for multiple records per day (e.g., multiple vaults, blockchains, symbols)
          const calculatedLimit = Math.min(Math.max(Math.ceil(diffDays * 10), 300), 3000);
          params.set('limit', calculatedLimit.toString());
        } else {
          params.set('limit', '3000');
        }

        const queryString = params.toString();

        // Temporary variables to store fetched data
        const fetchMorphoData = async (endpoint: string) => {
          try {
            const response = await fetch(`/api/morpho-data/${endpoint}?${queryString}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${endpoint} data`);
            }
            const result = await response.json();
            return { data: result.data || [], error: null };
          } catch (err) {
            console.error(`Error fetching ${endpoint} data:`, err);
            return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
          }
        };

        // Fetch WLD price data
        const fetchWldPriceData = async () => {
          try {
            const response = await fetch(`/api/data/wld-price?${queryString}`);
            if (!response.ok) {
              throw new Error('Failed to fetch WLD price data');
            }
            const result = await response.json();
            return { data: result.data || [], error: null };
          } catch (err) {
            console.error('Error fetching WLD price data:', err);
            return { data: [], error: err instanceof Error ? err : new Error(String(err)) };
          }
        };

        const [collateralResult, borrowResult, dexVolumeResult, earnResult, wldPriceResult] = await Promise.all([
          fetchMorphoData('collateral'),
          fetchMorphoData('borrow'),
          fetchMorphoData('dex-volume'),
          fetchMorphoData('earn'),
          fetchWldPriceData()
        ]);

        // Update ALL state at ONCE
        // This prevents cascading re-renders
        setCollateralData(collateralResult.data);
        setBorrowData(borrowResult.data);
        setDexVolumeData(dexVolumeResult.data);
        setEarnData(earnResult.data);
        setWldPriceData(wldPriceResult.data);
        setIsLoadingCollateral(false);
        setIsLoadingBorrow(false);
        setIsLoadingDexVolume(false);
        setIsLoadingEarn(false);
        setIsLoadingWldPrice(false);
        const errors = [
          collateralResult.error,
          borrowResult.error,
          dexVolumeResult.error,
          earnResult.error,
          wldPriceResult.error
        ].filter(Boolean);
        setError(errors.length > 0 ? 'Some analysis data failed to load.' : null);
      } catch (err) {
        console.error('Error fetching analysis data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analysis data');
        setIsLoadingCollateral(false);
        setIsLoadingBorrow(false);
        setIsLoadingDexVolume(false);
        setIsLoadingEarn(false);
        setIsLoadingWldPrice(false);
      }
    };

    fetchData();
  }, [fromDate, toDate, refreshKey]);

  const handleApplyDateRange = () => {
    // Trigger re-fetch by incrementing refreshKey
    setRefreshKey(prev => prev + 1);
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
        <DexVolumeChart data={dexVolumeData} isLoading={isLoadingDexVolume} wldPriceData={wldPriceData} isLoadingWldPrice={isLoadingWldPrice} fromDate={fromDate} toDate={toDate} />
        <EarnChart data={earnData} isLoading={isLoadingEarn} wldPriceData={wldPriceData} isLoadingWldPrice={isLoadingWldPrice} fromDate={fromDate} toDate={toDate} />
        <BorrowChart data={borrowData} isLoading={isLoadingBorrow} wldPriceData={wldPriceData} isLoadingWldPrice={isLoadingWldPrice} fromDate={fromDate} toDate={toDate} />
        <CollateralChart data={collateralData} isLoading={isLoadingCollateral} wldPriceData={wldPriceData} isLoadingWldPrice={isLoadingWldPrice} fromDate={fromDate} toDate={toDate} />
      </div>
    </div>
  );
}
