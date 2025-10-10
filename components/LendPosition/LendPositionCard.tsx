'use client';

import React from 'react';
import { LendPosition } from '@/types/morpho';
import { formatTokenAmount, formatUsdValue } from '@/lib/calculations';

interface LendPositionCardProps {
  position: LendPosition;
}

export function LendPositionCard({ position }: LendPositionCardProps) {
  const { market, state } = position;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900">
            {market.loanAsset.symbol} / {market.collateralAsset.symbol}
          </h4>
          <p className="text-xs text-gray-500 mt-1">Market ID: {market.uniqueKey.slice(0, 8)}...</p>
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
              Lending
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Supplied Assets</p>
          <div className="flex items-baseline space-x-2">
            <span className="font-medium text-lg">
              {formatTokenAmount(state.supplyAssets, market.loanAsset.decimals)}
            </span>
            <span className="text-sm text-gray-500">{market.loanAsset.symbol}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{formatUsdValue(state.supplyAssetsUsd)}</p>
        </div>

        {position.apy !== undefined && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Supply APY</p>
            <p className="text-lg font-medium text-success">
              {(position.apy * 100).toFixed(2)}%
            </p>
          </div>
        )}

        {position.marketUtilization !== undefined && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Market Utilization</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="h-2 rounded-full bg-morpho-blue transition-all"
                style={{
                  width: `${Math.min(100, position.marketUtilization * 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(position.marketUtilization * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
