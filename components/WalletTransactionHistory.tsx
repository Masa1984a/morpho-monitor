'use client';

import React, { useState } from 'react';
import { formatUnits } from 'viem';

interface WalletTransaction {
  direction: 'IN' | 'OUT';
  timestamp: string;
  block: number;
  txHash: string;
  token: string;
  tokenAddress: string;
  decimals: number;
  from: string;
  to: string;
  value: string;
}

interface WalletTransactionHistoryProps {
  walletAddress: string;
  onFetchHistory: (address: string) => Promise<WalletTransaction[]>;
}

export function WalletTransactionHistory({ walletAddress, onFetchHistory }: WalletTransactionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
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

  const formatAmount = (value: string, decimals: number) => {
    const amount = parseFloat(formatUnits(BigInt(value), decimals));
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  // トランザクションをカテゴリ分類 (SWAP/DEPOSIT/WITHDRAW)
  const categorizeTransactions = (transactions: WalletTransaction[]) => {
    // tx_hashでグループ化
    const txGroups = new Map<string, WalletTransaction[]>();
    for (const tx of transactions) {
      const key = tx.txHash;
      if (!txGroups.has(key)) {
        txGroups.set(key, []);
      }
      txGroups.get(key)!.push(tx);
    }

    // 各グループを分析してカテゴリを付与
    const categorized: Array<{
      category: 'SWAP' | 'DEPOSIT' | 'WITHDRAW';
      timestamp: string;
      txHash: string;
      transactions: WalletTransaction[];
    }> = [];

    for (const [txHash, txs] of txGroups.entries()) {
      const inTxs = txs.filter(t => t.direction === 'IN');
      const outTxs = txs.filter(t => t.direction === 'OUT');

      // 同じtx_hashでINとOUTが両方ある = SWAP
      if (inTxs.length > 0 && outTxs.length > 0) {
        categorized.push({
          category: 'SWAP',
          timestamp: txs[0].timestamp,
          txHash,
          transactions: txs
        });
      } else if (inTxs.length > 0) {
        categorized.push({
          category: 'DEPOSIT',
          timestamp: txs[0].timestamp,
          txHash,
          transactions: inTxs
        });
      } else {
        categorized.push({
          category: 'WITHDRAW',
          timestamp: txs[0].timestamp,
          txHash,
          transactions: outTxs
        });
      }
    }

    return categorized;
  };

  const categorized = categorizeTransactions(history);

  return (
    <div className="mt-6">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-morpho-blue"></div>
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
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categorized.map((item, index) => {
                    const inTxs = item.transactions.filter(t => t.direction === 'IN');
                    const outTxs = item.transactions.filter(t => t.direction === 'OUT');

                    let details = '';
                    let categoryLabel = '';
                    let categoryColor = '';

                    if (item.category === 'SWAP') {
                      // SWAP: OUT → IN
                      const outStr = outTxs.map(t => `${t.token} ${formatAmount(t.value, t.decimals)}`).join(' + ');
                      const inStr = inTxs.map(t => `${t.token} ${formatAmount(t.value, t.decimals)}`).join(' + ');
                      details = `${outStr} → ${inStr}`;
                      categoryLabel = 'SWAP';
                      categoryColor = 'bg-blue-100 text-blue-800';
                    } else if (item.category === 'DEPOSIT') {
                      // DEPOSIT: IN
                      details = inTxs.map(t => `← ${t.token} ${formatAmount(t.value, t.decimals)}`).join(', ');
                      categoryLabel = 'DEPOSIT';
                      categoryColor = 'bg-green-100 text-green-800';
                    } else {
                      // WITHDRAW: OUT
                      details = outTxs.map(t => `→ ${t.token} ${formatAmount(t.value, t.decimals)}`).join(', ');
                      categoryLabel = 'WITHDRAW';
                      categoryColor = 'bg-red-100 text-red-800';
                    }

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${categoryColor}`}>
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">{details}</td>
                        <td className="px-4 py-3 text-gray-700">{formatTimestamp(item.timestamp)}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {item.txHash.slice(0, 10)}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && history.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <p>Showing transactions from the last 4 days</p>
              <p className="mt-1">Total: {categorized.length} transactions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
