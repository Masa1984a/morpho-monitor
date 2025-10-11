'use client';

import React, { useState } from 'react';
import { MiniKitService } from '@/lib/minikit';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const minikit = MiniKitService.getInstance();
      const result = await minikit.connectWallet();

      if (result.success && result.address) {
        onConnect(result.address);
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Crypto assets management
          </h2>
          <p className="text-gray-600 mb-8">
            Connect your World App wallet to view crypto assets and health factor
          </p>

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`
              w-full py-3 px-6 rounded-full font-medium transition-all
              ${isConnecting
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-morpho-blue to-morpho-purple text-white hover:shadow-lg hover:scale-105'
              }
            `}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This is a third-party tool, not officially affiliated with World nor Morpho.
              Always verify positions on the official World & Morpho interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}