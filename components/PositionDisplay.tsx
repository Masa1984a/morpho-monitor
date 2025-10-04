'use client';

import React from 'react';
import { MarketPosition, HealthFactorData } from '@/types/morpho';
import { formatUsdValue, formatTokenAmount, calculateHealthFactor, getHealthFactorColor } from '@/lib/calculations';

interface PositionDisplayProps {
  position: MarketPosition;
}

export function PositionDisplay({ position }: PositionDisplayProps) {
  const { market, state } = position;
  const healthFactor = calculateHealthFactor(position);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {market.collateralAsset.symbol} / {market.loanAsset.symbol}
          </h4>
          <p className="text-xs text-gray-500 mt-1">Market ID: {market.uniqueKey.slice(0, 8)}...</p>
        </div>
        <HealthBadge healthFactor={healthFactor} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Collateral</p>
            <div className="flex items-baseline space-x-2">
              <span className="font-medium">
                {formatTokenAmount(state.collateral, market.collateralAsset.decimals)}
              </span>
              <span className="text-xs text-gray-500">{market.collateralAsset.symbol}</span>
            </div>
            <p className="text-sm text-gray-700">{formatUsdValue(state.collateralUsd)}</p>
          </div>

          {state.supplyAssets && parseFloat(state.supplyAssets) > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Supplied</p>
              <div className="flex items-baseline space-x-2">
                <span className="font-medium">
                  {formatTokenAmount(state.supplyAssets, market.loanAsset.decimals)}
                </span>
                <span className="text-xs text-gray-500">{market.loanAsset.symbol}</span>
              </div>
              <p className="text-sm text-gray-700">{formatUsdValue(state.supplyAssetsUsd)}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Borrowed</p>
            <div className="flex items-baseline space-x-2">
              <span className="font-medium">
                {formatTokenAmount(state.borrowAssets, market.loanAsset.decimals)}
              </span>
              <span className="text-xs text-gray-500">{market.loanAsset.symbol}</span>
            </div>
            <p className="text-sm text-gray-700">{formatUsdValue(state.borrowAssetsUsd)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-1">Utilization</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  healthFactor.status === 'danger' ? 'bg-danger' :
                  healthFactor.status === 'warning' ? 'bg-warning' : 'bg-success'
                }`}
                style={{
                  width: `${Math.min(100, (state.borrowAssetsUsd / state.collateralUsd) * 100 / parseFloat(market.lltv))}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((state.borrowAssetsUsd / state.collateralUsd) * 100).toFixed(1)}% / {(parseFloat(market.lltv) * 100).toFixed(0)}% LLTV
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HealthBadgeProps {
  healthFactor: HealthFactorData;
}

function HealthBadge({ healthFactor }: HealthBadgeProps) {
  const { value, status } = healthFactor;

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      status === 'healthy' ? 'bg-success/10 text-success' :
      status === 'warning' ? 'bg-warning/10 text-warning' :
      'bg-danger/10 text-danger'
    }`}>
      HF: {value === Infinity ? '∞' : value.toFixed(2)}
    </div>
  );
}

interface PositionListProps {
  positions: MarketPosition[];
}

export function PositionList({ positions }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No Morpho positions found on Base chain</p>
        <p className="text-sm text-gray-500 mt-2">
          Open positions on Morpho Blue to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {positions.map((position, index) => (
        <PositionDisplay key={position.market.uniqueKey || index} position={position} />
      ))}
    </div>
  );
}