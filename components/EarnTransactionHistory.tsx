'use client';

import React, { useState } from 'react';
import { getMarketConfigById } from '@/lib/market-config';
import { formatUnits } from 'viem';

interface EarnTransaction {
  type: 'Morpho Blue' | 'MetaMorpho';
  action: 'Supply' | 'Withdraw' | 'Deposit';
  direction: 'DEPOSIT' | 'WITHDRAW';
  timestamp: string;
  block: number;
  txHash: string;
  marketId?: string;
  vaultName?: string;
  vaultAddress?: string;
  token?: string;
  decimals?: number;
  args: any;
}

interface EarnTransactionHistoryProps {
  walletAddress: string;
  onFetchHistory: (address: string) => Promise<EarnTransaction[]>;
}

export function EarnTransactionHistory({ walletAddress, onFetchHistory }: EarnTransactionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<EarnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isOpen && history.length === 0) {
      // 初回クリック時に履歴を取得
      setIsLoading(true);
      setIsOpen(true); // 先に開いてローディングを表示
      try {
        const events = await onFetchHistory(walletAddress);
        setHistory(events);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventDetails = (event: EarnTransaction) => {
    if (event.type === 'Morpho Blue') {
      const marketConfig = getMarketConfigById(event.marketId || '');
      if (!marketConfig) {
        return {
          marketName: 'Unknown',
          token: '?',
          amount: '-'
        };
      }

      const { loanToken } = marketConfig;
      let amount = '-';

      if (event.args?.assets && loanToken) {
        const amountValue = parseFloat(formatUnits(event.args.assets, loanToken.decimals));
        const sign = event.direction === 'DEPOSIT' ? '+' : '-';
        amount = `${sign}${amountValue.toFixed(4)} ${loanToken.symbol}`;
      }

      return {
        marketName: marketConfig.marketName,
        token: loanToken?.symbol || '?',
        amount
      };
    } else {
      // MetaMorpho
      let amount = '-';
      if (event.args?.assets && event.decimals && event.token) {
        const amountValue = parseFloat(formatUnits(event.args.assets, event.decimals));
        const sign = event.direction === 'DEPOSIT' ? '+' : '-';
        amount = `${sign}${amountValue.toFixed(4)} ${event.token}`;
      }

      return {
        marketName: event.vaultName || 'Unknown Vault',
        token: event.token || '?',
        amount
      };
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-success text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <span className="font-medium flex items-center">
          Transaction History (Last 4 days)
          {isLoading && (
            <div className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-success"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No transaction history found in the last 4 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Direction</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Market</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((event, index) => {
                    const details = getEventDetails(event);
                    const directionSymbol = event.direction === 'DEPOSIT' ? '⬇' : '⬆';
                    const directionColor = event.direction === 'DEPOSIT' ? 'text-green-600' : 'text-red-600';

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className={`px-4 py-3 font-bold ${directionColor}`}>
                          {directionSymbol} {event.direction}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{event.type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              event.action === 'Supply' || event.action === 'Deposit'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {event.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{details.marketName}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">{details.amount}</td>
                        <td className="px-4 py-3 text-gray-700">{formatTimestamp(event.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && history.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <p>Legend: + = Deposit/Supply | - = Withdraw</p>
              <p className="mt-1">Showing transactions from the last 4 days</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
