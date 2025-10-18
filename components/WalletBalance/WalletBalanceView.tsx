'use client';

import React from 'react';
import { TokenBalance, NativeBalance, WLDVaultBalance, WLDSpendingBalance } from '@/types/wallet';
import { BalanceRow } from './BalanceRow';
import { LoadingState } from '../LoadingState';
// Transaction History機能は無料プランの制約により非表示
// import { WalletTransactionHistory } from '../WalletTransactionHistory';
// import { WorldChainRPCClient } from '@/lib/worldchain-rpc';

interface WalletBalanceViewProps {
  tokenBalances: TokenBalance[];
  nativeBalance: NativeBalance | null;
  wldVaultBalance: WLDVaultBalance | null;
  wldSpendingBalance: WLDSpendingBalance | null;
  isLoading: boolean;
  error: string | null;
  debugLogs?: string[];
  showDebugInfo?: boolean;
  onCopyDebugInfo?: () => void;
  debugCopied?: boolean;
  walletAddress?: string;
}

export function WalletBalanceView({
  tokenBalances,
  nativeBalance,
  wldVaultBalance,
  wldSpendingBalance,
  isLoading,
  error,
  debugLogs = [],
  showDebugInfo = false,
  onCopyDebugInfo,
  debugCopied = false,
  walletAddress
}: WalletBalanceViewProps) {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);

  const copyAddress = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Transaction History機能は無料プランの制約により非表示
  // const fetchHistory = async (address: string) => {
  //   const rpcClient = WorldChainRPCClient.getInstance();
  //   return await rpcClient.getWalletTransactionHistory(address);
  // };
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

  // Filter tokens with balance > 0, excluding WLD (shown in dedicated section)
  const tokensWithBalance = tokenBalances.filter(
    token => parseFloat(token.balance) > 0 && token.symbol !== 'WLD'
  );

  // Calculate WLD price per token
  const wldPriceUsd = (() => {
    if (wldVaultBalance && parseFloat(wldVaultBalance.amountNow) > 0) {
      return wldVaultBalance.amountNowUsd / parseFloat(wldVaultBalance.amountNow);
    }
    if (wldSpendingBalance && parseFloat(wldSpendingBalance.balance) > 0) {
      return wldSpendingBalance.balanceUsd / parseFloat(wldSpendingBalance.balance);
    }
    return 0;
  })();

  // Calculate total portfolio value including WLD Vault and Spending
  const totalValue =
    (nativeBalance?.balanceUsd || 0) +
    tokenBalances.reduce((sum, token) => sum + token.balanceUsd, 0) +
    (wldVaultBalance?.amountNowUsd || 0) +
    (wldSpendingBalance?.balanceUsd || 0);

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
      </div>

      {/* WLD Balances (Vault + Spending) */}
      {(wldVaultBalance || wldSpendingBalance) && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <img
                src="/crypto-logos/WLD.png"
                alt="WLD logo"
                className="w-8 h-8 mr-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">WLD</h3>
                {wldPriceUsd > 0 && (
                  <p className="text-sm text-gray-500">
                    ${wldPriceUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-gray-900">
                {(
                  parseFloat(wldVaultBalance?.amountNow || '0') +
                  parseFloat(wldSpendingBalance?.balance || '0')
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}
              </div>
              <div className="text-sm text-gray-600">
                ${(
                  (wldVaultBalance?.amountNowUsd || 0) +
                  (wldSpendingBalance?.balanceUsd || 0)
                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Locked (Vault) */}
          {wldVaultBalance && parseFloat(wldVaultBalance.amountNow) > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-900">Locked (Vault)</span>
                <span className="text-lg font-bold text-purple-900">
                  {parseFloat(wldVaultBalance.amountNow).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })} WLD
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-purple-600">
                <div className="flex justify-between">
                  <span>Principal:</span>
                  <span>{parseFloat(wldVaultBalance.principal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} WLD</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Accrued Interest:</span>
                  <span className="text-green-600 font-medium">
                    +{parseFloat(wldVaultBalance.accruedInterest).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} WLD
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-purple-200">
                <div className="flex items-center text-xs">
                  <span className="text-gray-600">Contract ID:&nbsp;</span>
                  <button
                    onClick={() => copyAddress('0x14a028cC500108307947dca4a1Aa35029FB66CE0', 'vault-world')}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                    title="Click to copy"
                  >
                    <span className="font-mono">0x14a0...6CE0</span>
                    {copiedAddress === 'vault-world' ? (
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
            </div>
          )}

          {/* Liquid (Spending) */}
          {wldSpendingBalance && parseFloat(wldSpendingBalance.balance) > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Liquid (Spending)</span>
                <span className="text-lg font-bold text-blue-900">
                  {parseFloat(wldSpendingBalance.balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })} WLD
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center text-xs">
                  <span className="text-gray-600">Contract ID:&nbsp;</span>
                  <button
                    onClick={() => copyAddress('0x2cFc85d8E48F8EAB294be644d9E25C3030863003', 'wld-world')}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                    title="Click to copy"
                  >
                    <span className="font-mono">0x2cFc...3003</span>
                    {copiedAddress === 'wld-world' ? (
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
            </div>
          )}
        </div>
      )}

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
              contractAddress={token.address}
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

      {/* Transaction History機能は無料プランの制約により非表示 */}
      {/* {walletAddress && (
        <WalletTransactionHistory
          walletAddress={walletAddress}
          onFetchHistory={fetchHistory}
        />
      )} */}

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
