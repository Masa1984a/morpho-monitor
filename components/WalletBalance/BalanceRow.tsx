'use client';

import React from 'react';

interface BalanceRowProps {
  symbol: string;
  balance: string;
  balanceUsd: number;
  priceUsd: number;
  logoPath?: string;
  contractAddress?: string;
}

export function BalanceRow({ symbol, balance, balanceUsd, priceUsd, logoPath, contractAddress }: BalanceRowProps) {
  const [contractCopied, setContractCopied] = React.useState(false);

  const formattedBalance = parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol === 'USDC' ? 2 : 6
  });

  // For very small prices (< $0.01), show more decimal places
  const getPriceDecimals = () => {
    if (priceUsd < 0.01 && priceUsd > 0) return 6;
    if (symbol === 'USDC') return 4;
    return 2;
  };

  const formattedPrice = priceUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: getPriceDecimals()
  });

  // For very small USD amounts (< $0.01), show more decimal places
  const getBalanceUsdDecimals = () => {
    if (balanceUsd < 0.01 && balanceUsd > 0) return 6;
    return 2;
  };

  const formattedBalanceUsd = balanceUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: getBalanceUsdDecimals()
  });

  const handleCopyContract = async () => {
    if (!contractAddress) return;
    try {
      await navigator.clipboard.writeText(contractAddress);
      setContractCopied(true);
      setTimeout(() => setContractCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy contract address:', err);
    }
  };

  return (
    <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {logoPath && (
            <img
              src={logoPath}
              alt={`${symbol} logo`}
              className="w-8 h-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <div className="font-semibold text-gray-900">{symbol}</div>
            <div className="text-sm text-gray-500">{formattedPrice}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-gray-900">{formattedBalance}</div>
          <div className="text-sm text-gray-600">{formattedBalanceUsd}</div>
        </div>
      </div>
      {contractAddress && (
        <button
          onClick={handleCopyContract}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors mt-2"
          title="Click to copy contract address"
        >
          <span>Contract ID: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
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
      )}
    </div>
  );
}
