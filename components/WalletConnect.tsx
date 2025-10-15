'use client';

import React, { useEffect, useState } from 'react';
import { FluidSimulationBackground } from './FluidSimulationBackground';
import { MiniKitService } from '@/lib/minikit';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Check if development mode is enabled
  const isDevMode = process.env.NEXT_PUBLIC_ENABLE_DEV_MODE === 'true';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const target = document.body;
    const previousBackground = target.style.background;
    const previousBackgroundColor = target.style.backgroundColor;
    const previousBackgroundImage = target.style.backgroundImage;

    // Ensure the safe-area padding matches the dark hero background.
    target.style.backgroundColor = '#04070f';
    target.style.backgroundImage = 'none';
    target.style.background = '#04070f';

    return () => {
      target.style.background = previousBackground;
      target.style.backgroundColor = previousBackgroundColor;
      target.style.backgroundImage = previousBackgroundImage;
    };
  }, []);

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

  const handleManualConnect = () => {
    setError(null);

    // Validate Ethereum address format (0x followed by 40 hex characters)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(manualAddress)) {
      setError('Invalid wallet address format. Must be a valid Ethereum address (0x...)');
      return;
    }

    onConnect(manualAddress);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#04070f] px-6 py-16 text-white">
      <FluidSimulationBackground className="opacity-90" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(167,139,250,0.25),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(14,116,144,0.22),transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[#04070f]/80 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-md px-10 py-14 shadow-2xl">
          <div className="relative text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-600">
              WalletConnect
            </div>
            <h2 className="mb-4 text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
              Crypto Asset Monitor
            </h2>
            <p className="mx-auto mb-10 max-w-md text-sm text-gray-600">
              Connect your World App wallet to view your asset, earning and borrowing.
            </p>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`group relative flex w-full items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
                isConnecting
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-gradient-to-r from-morpho-blue to-morpho-purple text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg
                    className="h-5 w-5 animate-spin text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                  Connect Wallet
                  <svg
                    className="h-4 w-4 text-white transition-transform group-hover:translate-x-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14m-4-4l4 4-4 4"
                    />
                  </svg>
                </span>
              )}
            </button>

            {/* Development Mode: Manual Wallet Input */}
            {isDevMode && (
              <div className="mt-6">
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showManualInput ? 'Hide' : 'Show'} Developer Mode (Manual Input)
                </button>

                {showManualInput && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      Development Mode: Enter a wallet address manually for testing
                    </div>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-morpho-blue focus:border-transparent text-gray-900"
                    />
                    <button
                      onClick={handleManualConnect}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Connect with Manual Address
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10 space-y-5 text-xs text-gray-600">
              <p className="text-gray-600">
                This is an independent community dashboard. Always verify your positions on the canonical World &amp; Morpho interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
