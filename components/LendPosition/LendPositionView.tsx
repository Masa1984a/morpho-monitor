'use client';

import React from 'react';
import { LendPosition } from '@/types/morpho';
import { LendPositionCard } from './LendPositionCard';
import { LoadingState } from '../LoadingState';
import { EarnTransactionHistory } from '../EarnTransactionHistory';
import { WorldChainRPCClient } from '@/lib/worldchain-rpc';

interface LendPositionViewProps {
  positions: LendPosition[];
  isLoading: boolean;
  error: string | null;
  debugLogs?: string[];
  showDebugInfo?: boolean;
  onCopyDebugInfo?: () => void;
  debugCopied?: boolean;
  walletAddress?: string;
}

export function LendPositionView({
  positions,
  isLoading,
  error,
  debugLogs = [],
  showDebugInfo = false,
  onCopyDebugInfo,
  debugCopied = false,
  walletAddress
}: LendPositionViewProps) {
  const fetchHistory = async (address: string) => {
    const rpcClient = WorldChainRPCClient.getInstance();
    return await rpcClient.getEarnTransactionHistory(address);
  };
  if (isLoading) {
    return <LoadingState message="Loading lending positions..." />;
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-gray-600 font-medium">No lending positions found</p>
        <p className="text-sm text-gray-500 mt-2">
          You have not supplied any assets to Morpho markets on World Chain
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Visit Morpho to start earning yield on your assets
        </p>
      </div>
    );
  }

  // Calculate total supplied value
  const totalSupplied = positions.reduce((sum, pos) => sum + pos.state.supplyAssetsUsd, 0);

  return (
    <div className="space-y-4">
      {/* Total Supplied Summary */}
      <div className="bg-gradient-to-r from-success to-green-600 rounded-lg p-6 text-white">
        <div className="text-sm opacity-90 mb-1">Total Supplied</div>
        <div className="text-3xl font-bold">
          {totalSupplied.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
      </div>

      {/* Position Cards */}
      <div className="space-y-4">
        {positions.map((position, index) => (
          <LendPositionCard key={position.market.uniqueKey || index} position={position} />
        ))}
      </div>

      {/* Transaction History */}
      {walletAddress && (
        <EarnTransactionHistory
          walletAddress={walletAddress}
          onFetchHistory={fetchHistory}
        />
      )}

      {/* Debug Info */}
      {showDebugInfo && debugLogs.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <div className="flex justify-between items-center mb-2">
            <strong>Debug Info:</strong>
            {onCopyDebugInfo && (
              <button
                onClick={onCopyDebugInfo}
                className="px-3 py-1 bg-morpho-blue text-white rounded hover:bg-morpho-purple transition-colors text-xs font-medium"
              >
                {debugCopied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="whitespace-pre-wrap max-h-96 overflow-y-auto">
            {debugLogs.join('\n')}
          </div>
        </div>
      )}
    </div>
  );
}
