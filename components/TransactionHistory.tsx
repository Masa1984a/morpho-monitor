'use client';

import React, { useState } from 'react';
import { getMarketConfigById } from '@/lib/market-config';
import { formatUnits } from 'viem';

interface TransactionEvent {
  event: string;
  timestamp: string;
  block: number;
  txHash: string;
  marketId: string;
  args: any;
}

interface TransactionHistoryProps {
  walletAddress: string;
  onFetchHistory: (address: string) => Promise<any[]>;
}

export function TransactionHistory({ walletAddress, onFetchHistory }: TransactionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<TransactionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isOpen && history.length === 0) {
      // 初回クリック時に履歴を取得
      setIsLoading(true);
      try {
        const events = await onFetchHistory(walletAddress);
        setHistory(events);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
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

  const getEventDetails = (event: TransactionEvent) => {
    const marketConfig = getMarketConfigById(event.marketId);
    if (!marketConfig) {
      return {
        marketName: 'Unknown',
        collateral: '-',
        loan: '-'
      };
    }

    const { collateralAsset, loanAsset } = marketConfig.collateralToken && marketConfig.loanToken
      ? {
          collateralAsset: marketConfig.collateralToken,
          loanAsset: marketConfig.loanToken
        }
      : { collateralAsset: null, loanAsset: null };

    let collateral = '-';
    let loan = '-';

    if (event.event === 'Borrow') {
      // Borrow: 借入額のみ (Loan増加)
      if (event.args?.assets && loanAsset) {
        const amount = parseFloat(formatUnits(event.args.assets, loanAsset.decimals));
        loan = `+${amount.toFixed(4)} ${loanAsset.symbol}`;
      }
    } else if (event.event === 'Repay') {
      // Repay: 返済額 (Loan減少)
      if (event.args?.assets && loanAsset) {
        const amount = parseFloat(formatUnits(event.args.assets, loanAsset.decimals));
        loan = `-${amount.toFixed(4)} ${loanAsset.symbol}`;
      }
    } else if (event.event === 'Liquidate') {
      // Liquidate: 担保減少、借入減少
      if (event.args?.seizedAssets && collateralAsset) {
        const amount = parseFloat(formatUnits(event.args.seizedAssets, collateralAsset.decimals));
        collateral = `-${amount.toFixed(4)} ${collateralAsset.symbol}`;
      }
      if (event.args?.repaidAssets && loanAsset) {
        const amount = parseFloat(formatUnits(event.args.repaidAssets, loanAsset.decimals));
        loan = `-${amount.toFixed(4)} ${loanAsset.symbol}`;
      }
    }

    return {
      marketName: marketConfig.marketName,
      collateral,
      loan
    };
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors"
      >
        <span className="font-medium">取引明細</span>
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-morpho-blue"></div>
              <p className="mt-2">読み込み中...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>取引履歴が見つかりませんでした</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Event</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Market</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Collateral</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Loan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((event, index) => {
                    const details = getEventDetails(event);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              event.event === 'Borrow'
                                ? 'bg-blue-100 text-blue-800'
                                : event.event === 'Repay'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {event.event}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatTimestamp(event.timestamp)}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{details.marketName}</td>
                        <td className="px-4 py-3 text-gray-700">{details.collateral}</td>
                        <td className="px-4 py-3 text-gray-700">{details.loan}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && history.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <p>凡例: + = 増加（Borrow） | - = 減少（Repay/Liquidate）</p>
              <p className="mt-1">直近5件の取引を表示しています</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
