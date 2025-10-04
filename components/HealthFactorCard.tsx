'use client';

import React from 'react';
import { HealthFactorData } from '@/types/morpho';
import { formatHealthFactor, formatUsdValue, getHealthFactorColor, getHealthFactorBgColor } from '@/lib/calculations';

interface HealthFactorCardProps {
  healthFactor: HealthFactorData;
  title?: string;
}

export function HealthFactorCard({ healthFactor, title = 'Health Factor' }: HealthFactorCardProps) {
  const { value, status, collateralUsd, borrowAssetsUsd, lltv } = healthFactor;

  return (
    <div className={`rounded-xl shadow-lg p-6 ${getHealthFactorBgColor(status)} border-2 ${status === 'danger' ? 'border-danger' : status === 'warning' ? 'border-warning' : 'border-success/20'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <StatusIndicator status={status} />
      </div>

      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${getHealthFactorColor(status)}`}>
          {formatHealthFactor(value)}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {status === 'danger' && 'Liquidation Risk!'}
          {status === 'warning' && 'Approaching Liquidation'}
          {status === 'healthy' && 'Position Healthy'}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Collateral Value:</span>
          <span className="font-medium">{formatUsdValue(collateralUsd)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Borrowed Value:</span>
          <span className="font-medium">{formatUsdValue(borrowAssetsUsd)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Liquidation LTV:</span>
          <span className="font-medium">{(lltv * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current LTV:</span>
          <span className="font-medium">
            {collateralUsd > 0 ? ((borrowAssetsUsd / collateralUsd) * 100).toFixed(1) : '0'}%
          </span>
        </div>
      </div>

      {status === 'danger' && (
        <div className="mt-4 p-3 bg-danger text-white rounded-lg">
          <p className="text-sm font-medium">
            ⚠️ Your position is at risk of liquidation. Consider repaying debt or adding collateral immediately.
          </p>
        </div>
      )}

      {status === 'warning' && (
        <div className="mt-4 p-3 bg-warning text-white rounded-lg">
          <p className="text-sm font-medium">
            ⚠️ Your health factor is below the safe threshold. Monitor closely and consider adjusting your position.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: 'healthy' | 'warning' | 'danger' }) {
  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full ${status === 'healthy' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'} ${status !== 'healthy' ? 'animate-pulse' : ''}`}></div>
      <span className={`ml-2 text-xs font-medium uppercase ${getHealthFactorColor(status)}`}>
        {status}
      </span>
    </div>
  );
}