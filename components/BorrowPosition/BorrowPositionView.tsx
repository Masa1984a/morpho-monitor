'use client';

import React from 'react';
import { BorrowPosition } from '@/types/morpho';
import { MarketPosition } from '@/types/morpho';
import { PositionList } from '../PositionDisplay';
import { LoadingState } from '../LoadingState';
import { HealthFactorThresholds } from '@/lib/calculations';

interface BorrowPositionViewProps {
  positions: BorrowPosition[];
  isLoading: boolean;
  error: string | null;
  thresholds?: HealthFactorThresholds;
  onSimulatePosition?: (position: MarketPosition) => void;
}

export function BorrowPositionView({
  positions,
  isLoading,
  error,
  thresholds,
  onSimulatePosition
}: BorrowPositionViewProps) {
  if (isLoading) {
    return <LoadingState message="Loading borrow positions..." />;
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  // Convert BorrowPosition back to MarketPosition for compatibility with existing PositionDisplay
  const marketPositions: MarketPosition[] = positions.map(pos => ({
    market: pos.market,
    state: pos.state
  }));

  if (positions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-gray-600 font-medium">No borrow positions found</p>
        <p className="text-sm text-gray-500 mt-2">
          You have not borrowed any assets from Morpho markets on World Chain
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Supported pairs: WETH→USDC, WETH→WLD, WBTC→WLD, WBTC→WETH, WBTC→USDC, WLD→USDC
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PositionList
        positions={marketPositions}
        thresholds={thresholds}
        onSimulatePosition={onSimulatePosition}
      />
    </div>
  );
}
