'use client';

import React from 'react';

interface BalanceRowProps {
  symbol: string;
  balance: string;
  balanceUsd: number;
  priceUsd: number;
  logoPath?: string;
}

export function BalanceRow({ symbol, balance, balanceUsd, priceUsd, logoPath }: BalanceRowProps) {
  const formattedBalance = parseFloat(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol === 'USDC' ? 2 : 6
  });

  const formattedPrice = priceUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: symbol === 'USDC' ? 4 : 2
  });

  const formattedBalanceUsd = balanceUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
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
  );
}
