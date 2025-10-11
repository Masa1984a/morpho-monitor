'use client';

import React from 'react';
import { LendPosition } from '@/types/morpho';
import { formatTokenAmount, formatUsdValue } from '@/lib/calculations';

interface LendPositionCardProps {
  position: LendPosition;
}

export function LendPositionCard({ position }: LendPositionCardProps) {
  const { market, state } = position;
  const [contractCopied, setContractCopied] = React.useState(false);

  // Check vault type
  const vaultType = (position as any).vaultType;
  const isMetaMorpho = vaultType === 'metamorpho';
  const isWorldAppVault = vaultType === 'worldapp-vault';
  const isMorphoBlue = vaultType === 'morpho-blue';

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(market.uniqueKey);
      setContractCopied(true);
      setTimeout(() => setContractCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy contract address:', err);
    }
  };

  // Determine title and type based on vault type
  let marketTitle: string;
  let marketType: string;
  let chainLabel: string | null = null;

  if (isWorldAppVault) {
    marketTitle = 'World App';
    marketType = 'WLD Savings on OP Mainnet';
    chainLabel = 'OP Mainnet';
  } else if (isMetaMorpho) {
    marketTitle = market.loanAsset.symbol;
    marketType = 'Morpho';
    chainLabel = 'World Chain';
  } else {
    marketTitle = `${market.collateralAsset.symbol} → ${market.loanAsset.symbol}`;
    marketType = 'Morpho Blue Market';
    chainLabel = 'World Chain';
  }

  // Determine which logo to use
  const logoSymbol = isWorldAppVault ? 'WLD' : 'Morpho';

  // Get World App Vault specific data if available
  const worldAppVaultData = isWorldAppVault ? (state as any) : null;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <img
              src={`/crypto-logos/${market.loanAsset.symbol}.png`}
              alt={`${market.loanAsset.symbol} logo`}
              className="w-6 h-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h4 className="text-lg font-semibold text-gray-900">
              {marketTitle}
            </h4>
          </div>
          <button
            onClick={handleCopyContract}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded px-2 py-1 transition-colors mt-1"
            title="Click to copy contract address"
          >
            <img
              src={`/crypto-logos/${logoSymbol}.png`}
              alt={`${marketType} logo`}
              className="w-3 h-3"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>Contract ID: {market.uniqueKey.slice(0, 6)}...{market.uniqueKey.slice(-4)}</span>
            {contractCopied ? (
              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current Balance */}
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="font-medium text-lg">
              {formatTokenAmount(state.supplyAssets, market.loanAsset.decimals)}
            </span>
            <span className="text-sm text-gray-500">{market.loanAsset.symbol}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{formatUsdValue(state.supplyAssetsUsd)}</p>
        </div>

        {/* World App Vault specific: Principal and Interest */}
        {isWorldAppVault && worldAppVaultData && (
          <>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600 mb-1">Principal</p>
              <div className="flex items-baseline space-x-2">
                <span className="font-medium text-base">
                  {formatTokenAmount(worldAppVaultData.principal, market.loanAsset.decimals)}
                </span>
                <span className="text-sm text-gray-500">{market.loanAsset.symbol}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{formatUsdValue(worldAppVaultData.principalUsd)}</p>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600 mb-1">Accrued Interest</p>
              <div className="flex items-baseline space-x-2">
                <span className="font-medium text-base text-success">
                  +{formatTokenAmount(worldAppVaultData.accruedInterest, market.loanAsset.decimals)}
                </span>
                <span className="text-sm text-gray-500">{market.loanAsset.symbol}</span>
              </div>
              <p className="text-sm text-success mt-1">+{formatUsdValue(worldAppVaultData.accruedInterestUsd)}</p>
            </div>

            {worldAppVaultData.lastCalc && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-1">Last Interest Calculation</p>
                <p className="text-xs text-gray-500">
                  {new Date(worldAppVaultData.lastCalc * 1000).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </>
        )}

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
