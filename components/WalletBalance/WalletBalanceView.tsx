'use client';

import React from 'react';
import { TokenBalance, NativeBalance } from '@/types/wallet';
import { BalanceRow } from './BalanceRow';
import { LoadingState } from '../LoadingState';

interface WalletBalanceViewProps {
  tokenBalances: TokenBalance[];
  nativeBalance: NativeBalance | null;
  isLoading: boolean;
  error: string | null;
  debugLogs?: string[];
  showDebugInfo?: boolean;
  onCopyDebugInfo?: () => void;
  debugCopied?: boolean;
}

export function WalletBalanceView({
  tokenBalances,
  nativeBalance,
  isLoading,
  error,
  debugLogs = [],
  showDebugInfo = false,
  onCopyDebugInfo,
  debugCopied = false
}: WalletBalanceViewProps) {
  if (isLoading) {
    return <LoadingState message="Loading wallet balances..." />;
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  // Filter tokens with balance > 0
  const tokensWithBalance = tokenBalances.filter(token => parseFloat(token.balance) > 0);

  // Calculate total portfolio value
  const totalValue =
    (nativeBalance?.balanceUsd || 0) +
    tokenBalances.reduce((sum, token) => sum + token.balanceUsd, 0);

  return (
    <div className="space-y-4">
      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-morpho-blue to-morpho-purple rounded-lg p-6 text-white">
        <div className="text-sm opacity-90 mb-1">Total Portfolio Value</div>
        <div className="text-3xl font-bold">
          {totalValue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
        <p className="text-xs opacity-70 mt-2">Note: Vaulted WLD balance cannot be displayed due to technical limitations</p>
      </div>

      {/* Token Balances */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y divide-gray-100">
        {nativeBalance && parseFloat(nativeBalance.balance) > 0 && (
          <BalanceRow
            symbol={nativeBalance.symbol}
            balance={nativeBalance.balance}
            balanceUsd={nativeBalance.balanceUsd}
            priceUsd={nativeBalance.priceUsd}
            logoPath="/crypto-logos/WETH.png"
          />
        )}

        {tokensWithBalance.length > 0 ? (
          tokensWithBalance.map((token) => (
            <BalanceRow
              key={token.address}
              symbol={token.symbol}
              balance={token.balance}
              balanceUsd={token.balanceUsd}
              priceUsd={token.priceUsd}
              logoPath={`/crypto-logos/${token.symbol}.png`}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">No token balances found</p>
            <p className="text-sm text-gray-500 mt-2">
              Your wallet appears to be empty on World Chain
            </p>
          </div>
        )}
      </div>

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
